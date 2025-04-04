# Semantic Analysis and Document Classification - A Basic Model

## Features

- Extracts text from uploaded PDF files.
- Classifies documents into categories: `Resume`, `Medical`, `Legal`, `Financial`, and `Other`.
- Uses **BERT embeddings** via SentenceTransformers (`all-MiniLM-L6-v2`) for deep semantic understanding.
- Performs keyword and context-based scoring using **spaCy** to improve classification accuracy.
- Stores and updates document vectors in **FAISS** (Facebook AI Similarity Search) index for efficient similarity search.
- Visualizes document embeddings using **t-SNE** for intuitive inspection of document clusters.
- Automatically organizes PDFs into labeled folders for easy access.

## Tech Stack

- Python  
- PyPDF2  
- spaCy  
- SentenceTransformers (SBERT)  
- FAISS (Facebook AI Similarity Search)  
- Matplotlib  
- scikit-learn (t-SNE)

## Setup Instructions

```sh
# Clone the repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Navigate to the model folder
cd Model_Classification

# Install dependencies
pip install PyPDF2 spacy faiss-cpu numpy sentence-transformers matplotlib scikit-learn

# Download required spaCy models
python -m spacy download en_core_web_md
python -m spacy download en_core_web_sm
