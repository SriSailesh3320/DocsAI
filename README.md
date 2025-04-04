# Document Processing System

## Overview
This project is a robust document processing system that extracts, classifies, analyzes, and manages documents using advanced AI and cloud-based solutions. It offers intelligent document retrieval, semantic search, and a user-friendly web interface.

## Technical Implementation

### 1. Text Extraction
We use:
- **AWS Textract** for high-efficiency OCR and handwriting recognition.
- **Python-based Tesseract and SpaCy** as alternatives for text extraction.

### 2. Document Classification
We employ a multi-layered approach:
- **Keyword-based classification** using SpaCy.
- **RoBERTa** trained on domain-specific datasets for deep classification.
- **Qwen** for AI-powered analysis and categorization.

### 3. Advanced AI Processing
- **OCR & Subcategory Detection** – Extracting structured data from documents.
- **Query Generation** – Identifying frequently asked questions from document content.
- **Key Detail Extraction & User Queries** – Summarizing critical information and answering user questions.
- **Sentiment Analysis** – Understanding document tone using Qwen.

### 4. Document Storage & Management
- **Bulk classification and storage** in Amazon S3 based on category.
- **User-entered document details** are stored relationally in MongoDB.
- **Structured history tracking** ensures document accessibility.

### 5. Authentication & Web Application
- **Authentication**: Secure login using NextAuth and Google Authentication.
- **User-Friendly UI**: A modern Next.js, React, Tailwind, and ShadCN/UI application for a seamless user experience.

### 6. Semantic Analysis & Document Linking
- **SBERT embeddings and SpaCy text analysis** to establish relationships between documents.
- **Intelligent document linking and retrieval** based on contextual similarity.
- ### A basci model design is given in ```/Model_Classification``` folder [Do refer it].

## Installation

### Prerequisites
- **Node.js** (Latest LTS version recommended)
- **Python 3.8+** (For SpaCy and OCR processing)
- **AWS Credentials** (For Textract and S3 storage)
- **MongoDB Database** (For user data storage)
- **SQLite** (For storing Qwen embeddings locally)

### Steps to Install
```sh
# Clone the repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env  # Update the .env file with your configurations

# Run the development server
npm run dev
