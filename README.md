# GeoSpectra-AI
"Scalable Remote Sensing for Mineral Targeting"

# ASTER Mineral Exploration Pipeline

## 🌍 Overview
This tool automates the processing of ASTER satellite imagery to identify hydrothermal alteration zones associated with Gold deposits (Epithermal, Orogenic, and Porphyry systems). It utilizes Google Earth Engine (GEE) and Python to perform atmospheric correction and calculate mineral band ratios.

## 🚀 Features
* **Interactive Mapping:** Select study areas dynamically using `geemap`.
* **Atmospheric Correction:** Automated Dark Object Subtraction (DOS) for SWIR/VNIR bands.
* **Mineral Indices:** Calculates 15+ specialized ratios (Kaolinite, Alunite, Propylitic, Gossan, etc.).
* **Data Visualization:** Clamped histograms and grayscale maps for structural analysis.
* **Export:** Automates GeoTIFF export to Google Drive.

## 🛠️ Tech Stack
* Python 3.x
* Google Earth Engine (ee)
* Geemap
* Pandas

## 📖 How to Run
1.  Click the "Open in Colab" badge above.
2.  Authenticate with your Google Cloud Project.
3.  Select your study area on the interactive map.
4.  Run the analysis cells.

## 📄 License
MIT License
