"""
U-Net segmentation training script for satellite imagery
Author: Generated for user by ChatGPT

Features:
- PyTorch implementation of U-Net (encoder-decoder with skip connections)
- Dataset class for image/mask pairs (supports PNG/JPG/GeoTIFF via rasterio if available)
- Training & validation loops with Dice / IoU metrics
- Augmentations using albumentations (if available)
- Checkpoint saving, inference, and simple visualization

Usage:
1. Install dependencies:
   pip install torch torchvision albumentations rasterio matplotlib tqdm

2. Prepare dataset folder with structure:
   dataset/
     images/        # satellite RGB images (e.g., .png, .jpg, .tif)
     masks/         # corresponding masks (single-channel, integer labels, same filename as image)

3. Run training (example):
   python unet_segmentation.py --data-root ./dataset --epochs 50 --batch-size 8 --num-classes 4

Notes:
- Masks must use label integers 0..(num_classes-1) per pixel
- For multi-band geotiffs, rasterio will be used to read them. If rasterio is not installed, use PNG/JPG
- Adjust learning rate, augmentations, and model depth for your dataset

"""

import os
import argparse
from glob import glob
from tqdm import tqdm

import numpy as np
import matplotlib.pyplot as plt

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms

# Optional dependencies
try:
    import albumentations as A
    from albumentations.pytorch import ToTensorV2
    HAS_ALB = True
except Exception:
    HAS_ALB = False

try:
    import rasterio
    HAS_RASTERIO = True
except Exception:
    HAS_RASTERIO = False


# --------------------------
# U-Net model (PyTorch)
# --------------------------
class DoubleConv(nn.Module):
    def __init__(self, in_ch, out_ch):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        return self.net(x)


class UNet(nn.Module):
    def __init__(self, in_channels=3, out_classes=4, features=[64, 128, 256, 512]):
        super().__init__()
        self.downs = nn.ModuleList()
        self.ups = nn.ModuleList()
        # Down part
        prev = in_channels
        for f in features:
            self.downs.append(DoubleConv(prev, f))
            prev = f
        # Up part
        for f in reversed(features[:-1]):
            self.ups.append(nn.ConvTranspose2d(prev, f, kernel_size=2, stride=2))
            self.ups.append(DoubleConv(prev, f))
            prev = f
        # Bottleneck
        self.bottleneck = DoubleConv(features[-2], features[-1]) if len(features) >= 2 else DoubleConv(prev, prev)
        # Final conv
        self.final_conv = nn.Conv2d(features[0], out_classes, kernel_size=1)
        # Maxpool
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)

    def forward(self, x):
        skips = []
        out = x
        # Encoder
        for down in self.downs:
            out = down(out)
            skips.append(out)
            out = self.pool(out)
        # Bottleneck
        out = self.bottleneck(out)
        # Decoder
        for idx in range(0, len(self.ups), 2):
            up_tr = self.ups[idx]
            conv = self.ups[idx + 1]
            out = up_tr(out)
            skip = skips.pop()
            # If shapes mismatch because of odd dims, center crop skip
            if out.shape != skip.shape:
                skip = center_crop(skip, out.shape[2], out.shape[3])
            out = torch.cat([skip, out], dim=1)
            out = conv(out)
        return self.final_conv(out)


def center_crop(tensor, target_h, target_w):
    _, _, h, w = tensor.size()
    dh = (h - target_h) // 2
    dw = (w - target_w) // 2
    return tensor[:, :, dh:dh + target_h, dw:dw + target_w]


# --------------------------
# Dataset
# --------------------------
class SegmentationDataset(Dataset):
    def __init__(self, images, masks, transforms=None, num_channels=3):
        assert len(images) == len(masks), "images and masks must correspond"
        self.images = images
        self.masks = masks
        self.transforms = transforms
        self.num_channels = num_channels

    def __len__(self):
        return len(self.images)

    def _read_image(self, path):
        if HAS_RASTERIO and path.lower().endswith(('.tif', '.tiff')):
            with rasterio.open(path) as src:
                arr = src.read()  # (C, H, W)
                arr = np.transpose(arr, (1, 2, 0))
                # If more than requested channels, take first num_channels
                if arr.shape[2] >= self.num_channels:
                    arr = arr[:, :, :self.num_channels]
                else:
                    # pad channels if needed
                    pad = np.zeros((arr.shape[0], arr.shape[1], self.num_channels - arr.shape[2]), dtype=arr.dtype)
                    arr = np.concatenate([arr, pad], axis=2)
                # normalize to 0-255 if floats
                if arr.dtype.kind == 'f':
                    arr = (arr - arr.min()) / (arr.max() - arr.min() + 1e-9) * 255.0
                return arr.astype(np.uint8)
        else:
            from PIL import Image
            img = Image.open(path).convert('RGB')
            return np.array(img)

    def _read_mask(self, path):
        if HAS_RASTERIO and path.lower().endswith(('.tif', '.tiff')):
            with rasterio.open(path) as src:
                arr = src.read(1)  # single channel
                return arr.astype(np.int64)
        else:
            from PIL import Image
            m = Image.open(path)
            arr = np.array(m)
            # If RGB mask, reduce to single channel by taking first band
            if arr.ndim == 3:
                arr = arr[:, :, 0]
            return arr.astype(np.int64)

    def __getitem__(self, idx):
        img = self._read_image(self.images[idx])
        mask = self._read_mask(self.masks[idx])
        # If mask and image sizes mismatch, resize mask to image size
        if mask.shape[0] != img.shape[0] or mask.shape[1] != img.shape[1]:
            from PIL import Image
            mask = np.array(Image.fromarray(mask).resize((img.shape[1], img.shape[0]), resample=Image.NEAREST))
        # Apply augmentations
        if self.transforms is not None:
            if HAS_ALB:
                augmented = self.transforms(image=img, mask=mask)
                img = augmented['image']
                mask = augmented['mask']
            else:
                # fallback simple transforms
                img = transforms.ToTensor()(img)
                mask = torch.from_numpy(mask).long()
        else:
            img = transforms.ToTensor()(img)
            mask = torch.from_numpy(mask).long()
        return img, mask


# --------------------------
# Losses & Metrics
# --------------------------

class DiceLoss(nn.Module):
    def __init__(self, eps=1e-6):
        super().__init__()
        self.eps = eps

    def forward(self, logits, targets):
        # expects logits (N, C, H, W), targets (N, H, W) with class labels
        num_classes = logits.shape[1]
        probs = F.softmax(logits, dim=1)
        targets_onehot = F.one_hot(targets, num_classes).permute(0, 3, 1, 2).float()
        inter = torch.sum(probs * targets_onehot, dim=(2, 3))
        union = torch.sum(probs + targets_onehot, dim=(2, 3))
        dice = (2.0 * inter + self.eps) / (union + self.eps)
        return 1.0 - dice.mean()


def iou_score(logits, targets, ignore_index=None):
    num_classes = logits.shape[1]
    preds = torch.argmax(logits, dim=1)
    ious = []
    for c in range(num_classes):
        if ignore_index is not None and c == ignore_index:
            continue
        pred_c = (preds == c)
        targ_c = (targets == c)
        inter = (pred_c & targ_c).sum().item()
        union = (pred_c | targ_c).sum().item()
        if union == 0:
            ious.append(float('nan'))
        else:
            ious.append(inter / union)
    # return mean IoU ignoring nan
    ious = [v for v in ious if not np.isnan(v)]
    return np.mean(ious) if len(ious) > 0 else 0.0


# --------------------------
# Helpers: dataset split, file matching
# --------------------------

def make_pairs(images_dir, masks_dir, exts=('png', 'jpg', 'jpeg', 'tif', 'tiff')):
    imgs = []
    for ext in exts:
        imgs.extend(sorted(glob(os.path.join(images_dir, f'**/*.{ext}'), recursive=True)))
    masks = []
    for ext in exts:
        masks.extend(sorted(glob(os.path.join(masks_dir, f'**/*.{ext}'), recursive=True)))
    # naive filename based matching
    img_map = {os.path.splitext(os.path.basename(p))[0]: p for p in imgs}
    mask_map = {os.path.splitext(os.path.basename(p))[0]: p for p in masks}
    common = set(img_map.keys()) & set(mask_map.keys())
    images = [img_map[k] for k in sorted(common)]
    masks = [mask_map[k] for k in sorted(common)]
    return images, masks


# --------------------------
# Training & Validation
# --------------------------

def train_one_epoch(model, loader, optim, criterion, device):
    model.train()
    running_loss = 0.0
    for imgs, masks in tqdm(loader, desc='Train', leave=False):
        imgs = imgs.to(device)
        masks = masks.to(device)
        optim.zero_grad()
        logits = model(imgs)
        loss_ce = criterion['ce'](logits, masks)
        loss_dice = criterion['dice'](logits, masks)
        loss = loss_ce + loss_dice
        loss.backward()
        optim.step()
        running_loss += loss.item() * imgs.size(0)
    return running_loss / len(loader.dataset)


def validate(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    iou_vals = []
    with torch.no_grad():
        for imgs, masks in tqdm(loader, desc='Val', leave=False):
            imgs = imgs.to(device)
            masks = masks.to(device)
            logits = model(imgs)
            loss_ce = criterion['ce'](logits, masks)
            loss_dice = criterion['dice'](logits, masks)
            loss = loss_ce + loss_dice
            running_loss += loss.item() * imgs.size(0)
            iou_vals.append(iou_score(logits.cpu(), masks.cpu()))
    avg_iou = float(np.nanmean(iou_vals)) if len(iou_vals) > 0 else 0.0
    return running_loss / len(loader.dataset), avg_iou


# --------------------------
# Visualization for quick checks
# --------------------------

def visualize_prediction(image, mask, pred, class_names=None):
    # image: (C,H,W) tensor or numpy
    # mask, pred: (H,W)
    if isinstance(image, torch.Tensor):
        image = image.permute(1, 2, 0).cpu().numpy()
    fig, axes = plt.subplots(1, 3, figsize=(12, 4))
    axes[0].imshow(image.astype(np.uint8))
    axes[0].set_title('Image')
    axes[1].imshow(mask, cmap='tab20')
    axes[1].set_title('Ground Truth')
    axes[2].imshow(pred, cmap='tab20')
    axes[2].set_title('Prediction')
    for ax in axes:
        ax.axis('off')
    plt.tight_layout()
    plt.show()


# --------------------------
# Main: parse args, prepare data, run training
# --------------------------

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-root', type=str, required=True, help='dataset root with images/ and masks/')
    parser.add_argument('--epochs', type=int, default=30)
    parser.add_argument('--batch-size', type=int, default=4)
    parser.add_argument('--lr', type=float, default=1e-3)
    parser.add_argument('--num-classes', type=int, default=4)
    parser.add_argument('--num-channels', type=int, default=3)
    parser.add_argument('--save-dir', type=str, default='./checkpoints')
    parser.add_argument('--img-size', type=int, default=256)
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()

    images_dir = os.path.join(args.data_root, 'images')
    masks_dir = os.path.join(args.data_root, 'masks')
    images, masks = make_pairs(images_dir, masks_dir)
    if len(images) == 0:
        raise RuntimeError('No image-mask pairs found. Check dataset structure and filenames.')

    # split
    split = int(0.8 * len(images))
    train_imgs, val_imgs = images[:split], images[split:]
    train_masks, val_masks = masks[:split], masks[split:]

    # transforms
    if HAS_ALB:
        train_transforms = A.Compose([
            A.RandomCrop(args.img_size, args.img_size),
            A.HorizontalFlip(p=0.5),
            A.VerticalFlip(p=0.5),
            A.RandomRotate90(p=0.5),
            A.Normalize(),
            ToTensorV2(),
        ])
        val_transforms = A.Compose([
            A.CenterCrop(args.img_size, args.img_size),
            A.Normalize(),
            ToTensorV2(),
        ])
    else:
        train_transforms = None
        val_transforms = None

    train_ds = SegmentationDataset(train_imgs, train_masks, transforms=train_transforms, num_channels=args.num_channels)
    val_ds = SegmentationDataset(val_imgs, val_masks, transforms=val_transforms, num_channels=args.num_channels)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=args.workers)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=args.workers)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = UNet(in_channels=args.num_channels, out_classes=args.num_classes).to(device)

    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)
    ce_loss = nn.CrossEntropyLoss()
    dice_loss = DiceLoss()
    criterion = {'ce': ce_loss, 'dice': dice_loss}

    os.makedirs(args.save_dir, exist_ok=True)

    best_iou = 0.0
    for epoch in range(1, args.epochs + 1):
        print(f'Epoch {epoch}/{args.epochs}')
        train_loss = train_one_epoch(model, train_loader, optimizer, criterion, device)
        val_loss, val_iou = validate(model, val_loader, criterion, device)
        print(f'  train loss: {train_loss:.4f}  val loss: {val_loss:.4f}  val IoU: {val_iou:.4f}')
        # save checkpoint
        ckpt = os.path.join(args.save_dir, f'unet_epoch{epoch:03d}.pth')
        torch.save({'epoch': epoch, 'model_state': model.state_dict(), 'optimizer_state': optimizer.state_dict()}, ckpt)
        if val_iou > best_iou:
            best_iou = val_iou
            best_path = os.path.join(args.save_dir, 'unet_best.pth')
            torch.save({'epoch': epoch, 'model_state': model.state_dict(), 'optimizer_state': optimizer.state_dict()}, best_path)
            print('  saved best model')

    print('Training complete. Best val IoU:', best_iou)


if __name__ == '__main__':
    main()
