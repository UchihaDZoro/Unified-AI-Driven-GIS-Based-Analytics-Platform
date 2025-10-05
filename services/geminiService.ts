import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LatLngBounds } from 'leaflet';
import { LandUsePercentages, SustainabilityReport, MapInsights, BiodiversityAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function analyzeImageForBiodiversity(base64Image: string, mimeType: string): Promise<BiodiversityAnalysisResult> {
    const model = 'gemini-2.5-flash-image';

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Image,
      },
    };
    
    const textPart = {
        text: `Recolor the regions of the provided aerial image based on this legend:
- Buildings: solid gray (#808080)
- Roads: solid dark gray (#696969)
- Land (bare soil, sand): solid brown (#A52A2A)
- Vegetation (trees, grass): solid green (#008000)
- Water: solid blue (#0000FF)
- Other/Unlabeled: solid black (#000000)

Return this new segmented image.
Then, as a separate instruction, return a text response containing ONLY a valid JSON object that calculates the percentage area of each category. Use these exact keys: "Building", "Road", "Land", "Vegetation", "Water", and "Unlabeled". If a category is not present, set its value to 0.`
    };
    
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        }
    });
    
    let jsonString = '';
    let segmentedImage = '';
    let segmentedImageMimeType = 'image/png'; // Default mime type

    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                // The model can sometimes return the JSON wrapped in markdown, even when asked not to.
                // This regex will extract JSON from a markdown code block.
                const jsonMatch = part.text.match(/```(json)?\s*(\{[\s\S]*\})\s*```/);
                if (jsonMatch && jsonMatch[2]) {
                    jsonString = jsonMatch[2];
                } else {
                    // Fallback to finding any JSON-like structure if markdown is not used.
                    const simpleJsonMatch = part.text.match(/\{[\s\S]*\}/);
                    if (simpleJsonMatch) {
                        jsonString = simpleJsonMatch[0];
                    }
                }
            } else if (part.inlineData) {
                segmentedImage = part.inlineData.data;
                segmentedImageMimeType = part.inlineData.mimeType;
            }
        }
    }

    if (!jsonString || !segmentedImage) {
        console.error("API Response was incomplete:", JSON.stringify(response, null, 2));
        throw new Error("Failed to get complete analysis from the API. Missing JSON or segmented image.");
    }
    
    try {
        const percentages = JSON.parse(jsonString) as LandUsePercentages;
        return {
            percentages: percentages,
            segmentedImage: `data:${segmentedImageMimeType};base64,${segmentedImage}`
        };
    } catch (e) {
        console.error("Failed to parse JSON string:", jsonString, e);
        throw new Error("Failed to parse analysis data from the API.");
    }
}

export async function getSustainabilityReport(mapData: { urbanAreas: number; vegetation: number; waterBodies: number, populationDensity: number, bounds?: LatLngBounds }, image?: { base64: string, mimeType: string }): Promise<SustainabilityReport> {
    const model = "gemini-2.5-flash";

    let prompt = `
        You are a sustainable urban planning AI assistant. Analyze the following GIS data and provide recommendations for sustainable development.
    `;

    if (mapData.bounds) {
        prompt += `
            The area is defined by the bounding box:
            - Southwest corner: ${mapData.bounds.getSouthWest().lat}, ${mapData.bounds.getSouthWest().lng}
            - Northeast corner: ${mapData.bounds.getNorthEast().lat}, ${mapData.bounds.getNorthEast().lng}
        `;
    }

    prompt += `
        Current land use estimates for this area:
        - Urban Areas: ${mapData.urbanAreas.toFixed(1)}%
        - Vegetation: ${mapData.vegetation.toFixed(1)}%
        - Water Bodies: ${mapData.waterBodies.toFixed(1)}%
        
        Current estimated population density:
        - Population Density: ${mapData.populationDensity} people/km²
        
        ${image ? "Additionally, analyze this satellite image of the area." : ""}

        Given this data, provide a detailed analysis and specific, actionable recommendations.
        1. ${mapData.bounds ? "Identify the district this area is likely in." : "Provide a general analysis as location is not specified."}
        2. ${mapData.bounds ? "Estimate the total population within this bounding box." : "Skip population estimate."}
        3. Calculate a sustainability index from 0 to 100, where 100 is most sustainable.
        4. Provide key metrics and recommendations.

        Provide the output as a valid JSON object only, with no other text before or after it, following this exact schema:
        {
          "district": "The identified district name. If not available, provide a general location description or null.",
          "estimatedPopulation": A number for the estimated population. If not available, provide null.,
          "sustainabilityMetrics": {
            "roadDevelopmentPotential": "A percentage value, e.g., '15%'",
            "infrastructureIncreasePotential": "A percentage value, e.g., '10%'",
            "minimumWaterPreservation": "A percentage value, e.g., '95%'",
            "maxBuildingDensityIncrease": "A percentage value, e.g., '20%'"
          },
          "recommendations": [
            "A short, actionable recommendation.",
            "Another short, actionable recommendation.",
            "A third short, actionable recommendation."
          ],
          "sustainabilityIndex": A number between 0 and 100,
          "analysis": "A brief, one-paragraph textual analysis of the area's current state and potential."
        }
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            district: { type: Type.STRING, nullable: true },
            estimatedPopulation: { type: Type.NUMBER, nullable: true },
            sustainabilityMetrics: {
                type: Type.OBJECT,
                properties: {
                    roadDevelopmentPotential: { type: Type.STRING },
                    infrastructureIncreasePotential: { type: Type.STRING },
                    minimumWaterPreservation: { type: Type.STRING },
                    maxBuildingDensityIncrease: { type: Type.STRING }
                },
                required: ["roadDevelopmentPotential", "infrastructureIncreasePotential", "minimumWaterPreservation", "maxBuildingDensityIncrease"]
            },
            recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            sustainabilityIndex: { type: Type.NUMBER },
            analysis: { type: Type.STRING }
        },
        required: ["sustainabilityMetrics", "recommendations", "sustainabilityIndex", "analysis", "district", "estimatedPopulation"]
    };

    const textPart = { text: prompt };
    const parts: any[] = [textPart];
    if (image) {
        parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.base64,
        },
      });
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });
    
    const jsonString = response.text.trim();
    return JSON.parse(jsonString) as SustainabilityReport;
}

export async function getMapInsights(bounds: LatLngBounds, topics: string[], customTopic?: string): Promise<MapInsights> {
    const model = "gemini-2.5-flash";

    const allTopics = [...topics];
    if (customTopic && customTopic.trim() !== '') {
        allTopics.push(customTopic.trim());
    }

    const topicPrompts = allTopics.map(topic => {
        if (topic.toLowerCase() === 'safety') {
            return `"safety": "Detailed analysis of public safety. Consider factors like population density, road networks, proximity to emergency services, and typical crime patterns for such an area (e.g., urban core, suburb, industrial park). Mention potential risks and safety improvement suggestions."`;
        }
        const key = topic.trim().toLowerCase().replace(/\s+/g, '_');
        return `"${key}": "A concise, one-paragraph analysis for the topic: ${topic}."`;
    }).join(',\n');


    const prompt = `
        You are an expert GIS and urban planning AI analyst. Analyze the geographical area defined by the bounding box:
        - Southwest corner: ${bounds.getSouthWest().lat}, ${bounds.getSouthWest().lng}
        - Northeast corner: ${bounds.getNorthEast().lat}, ${bounds.getNorthEast().lng}

        Based on these coordinates, first briefly state the district or neighborhood. Then, for that identified location, provide a concise, one-paragraph analysis for each of the requested topics.

        Provide the output as a valid JSON object only, with no other text before or after it. The keys must be the topics you analyzed, plus a 'district' key. The topic keys in the JSON must be lowercased and use underscores instead of spaces.
        
        Generate the JSON object with the following structure and content requirements:
        {
          "district": "The identified district or neighborhood name.",
          ${topicPrompts}
        }
    `;

    const responseSchemaProperties: { [key: string]: { type: Type, description?: string } } = {
        district: { type: Type.STRING, description: "The identified district or neighborhood name."}
    };
    const requiredFields = ['district'];

    allTopics.forEach(topic => {
        const key = topic.trim().toLowerCase().replace(/\s+/g, '_');
        if (key) {
            responseSchemaProperties[key] = { type: Type.STRING, description: `Analysis for the ${topic} topic.` };
            requiredFields.push(key);
        }
    });

    const responseSchema = {
        type: Type.OBJECT,
        properties: responseSchemaProperties,
        required: requiredFields
    };

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [{ text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });
    
    const jsonString = response.text.trim();
    return JSON.parse(jsonString) as MapInsights;
}