# 🌍 AI-Driven GIS Analytics Platform

A unified **AI-powered Geographic Information System (GIS) platform** for analyzing, tracking, and visualizing urban and environmental data. This platform combines interactive mapping with AI-driven analytics (powered by **U-Net based image segmentation** and other ML pipelines) to generate insights on **crime, pollution, biodiversity, infrastructure, sustainability, and urban development**.

It is designed as a **research and planning tool** for urban developers, policymakers, researchers, and civic authorities to make **data-driven, sustainable decisions**.

---

## ✨ Key Features

### 🗺️ Interactive Mapping

* Built with **Leaflet.js** for dynamic maps.
* Pan, zoom, and toggle between multiple base layers (urban, vegetation, transport).
* Define an **Analysis Radius** to focus on regions of interest.

### 🤖 AI-Powered Land Cover Analysis

* Upload satellite imagery or select an area from the map.
* Uses **U-Net deep learning model** for semantic segmentation.
* Detects and classifies land cover types:

  * 🏢 **Buildings**
  * 🌱 **Vegetation**
  * 💧 **Water Bodies**
  * 🛣️ **Infrastructure**
* Provides:

  * Original vs segmented image (side-by-side).
  * Percentage breakdown of each land cover type.
  * Exportable results for further analysis.

### 📊 AI-Generated Sustainability Reports

* Auto-generates sustainability assessments for selected regions.
* Provides:

  * **Sustainability Index (0–100)**.
  * Building density and vegetation ratios.
  * Infrastructure potential (roads, transport, housing).
  * Actionable recommendations for sustainable development.

### 🔍 On-Demand GIS Insights

* Generate quick **topic-based insights** such as:

  * **Safety & Crime Mapping**
  * **Pollution Monitoring**
  * **Tourism Accessibility**
  * **Infrastructure Stress Zones**

### 🌐 Integrated Risk Maps

* Includes pre-built risk maps for:

  * **Crime Hotspots**
  * **Transportation Risk Zones**
  * **Biodiversity Stress**
  * **Vegetation Loss**
  * **Water Body Risks**
* Maps are available as **iframes and local HTML layers** for seamless integration.

---

## 🛠️ Tech Stack

**Frontend:** React + TypeScript
**Mapping:** Leaflet.js
**AI/ML Models:** U-Net (image segmentation), Scikit-learn pipelines
**Data Handling:** JSON + REST APIs
**Visualization:** Risk map layers, Chart components
**Build Tool:** Vite

---

## 🚀 Getting Started

### Prerequisites

* Node.js >= 18
* npm or yarn
* Python 3.9+ (for ML model integration with U-Net)

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/ai-gis-platform.git

# Enter directory
cd ai-gis-platform

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## 📖 Usage

1. Open the platform in the browser (`http://localhost:5173`).
2. Navigate the **map interface** and select an area.
3. Upload a satellite image or run local analysis.
4. Perform **land cover segmentation** (U-Net).
5. View **sustainability reports & recommendations**.
6. Explore **risk maps** for crime, biodiversity, water, and infrastructure.

---

## 🔬 AI/ML Integration

* **U-Net for Segmentation:**

  * Input: Satellite imagery.
  * Output: Segmented regions for buildings, vegetation, water, infrastructure.
  * Applications: Land use planning, deforestation tracking, urban expansion monitoring.

* **Additional ML Pipelines:**

  * Pollution risk detection.
  * Crime data clustering.
  * Infrastructure stress analysis.

---

## 🌟 Use Cases

* **Urban Development:** Plan housing, transport, and infrastructure.
* **Environmental Monitoring:** Detect deforestation, biodiversity stress, water scarcity.
* **Risk Management:** Assess crime, pollution, and disaster-prone regions.
* **Policy & Governance:** Provide data-driven urban strategies.
* **Tourism & Accessibility:** Highlight sustainable and safe zones.

---

## 📌 Future Enhancements

* Integration with **real-time IoT sensors** (pollution, weather, traffic).
* **Time-series analysis** of satellite data for trend detection.
* Support for **3D GIS visualization**.
* Advanced deep learning (e.g., Vision Transformers for higher accuracy).
* Mobile-friendly lightweight version.

---

## 📜 License

Licensed under the **MIT License** – free to use and modify.

---

## 🤝 Contributing

Contributions are welcome! Please fork the repo and create pull requests.

---

## 👨‍💻 Author

Developed by **Pathan Gulamgaush (UchihaDZoro)** 🚀
