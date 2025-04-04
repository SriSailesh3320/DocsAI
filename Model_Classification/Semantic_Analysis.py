# Install the libraries before runnig the file. 

# 1. Extraction of text from PDF's that are uploaded.
# 2. Analysis of text extracted and classificaiton of documents into categories.
# 3. creating vector embeddings suing SBERT and using FAISS for smart similar searching.
# 4. Showing detailed results of the simialrity of the documents.
# 5. Visualizing the Documents for a better view of understanding.


# import boto3  # Removed for AWS
import os
import PyPDF2
import shutil
import spacy
from collections import Counter
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import traceback
import matplotlib.pyplot as plt
from sklearn.manifold import TSNE


class DocumentResult:
    def __init__(self, file_path, category, scores, similar_documents):
        self.file_path = file_path
        self.category = category
        self.scores = scores
        self.similar_documents = similar_documents

    def __str__(self):
        result = f"File: {self.file_path}\n"
        result += f"Category: {self.category}\n"
        result += "Scores:\n"
        for category, score in self.scores.items():
            result += f"  {category}: {score}\n"
        result += "Similar Documents:\n"
        for doc in self.similar_documents:
            result += f"  - {doc['similar_document']} (Distance: {doc['distance']:.4f})\n"
        return result

# Creation of folders if they do not exist.
def create_folders():
    
    base_dir = 'classified_docs'
    folders = ['medical', 'financial', 'legal', 'resume', 'other']
    for folder in folders:
        folder_path = os.path.join(base_dir, folder)
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)


# Safe movement of file from source to destination.
def safe_move_file(src, dst):
    if os.path.exists(dst):
        base, extension = os.path.splitext(dst)
        counter = 1
        while os.path.exists(f"{base}_{counter}{extension}"):
            counter += 1
        dst = f"{base}_{counter}{extension}"
    shutil.move(src, dst)
    return dst



# Extraction of text from PDF files.
def extract_text_from_pdf(file_path):
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ''
            for page in pdf_reader.pages:
                text += page.extract_text()
            return text.lower()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""



# Initializing SBERT model.
sbert_model = SentenceTransformer('all-MiniLM-L6-v2')



# Analysis of text using spaCy and classification of files into categories
def analyze_text(text):
    
    nlp = spacy.load("en_core_web_md")
    doc = nlp(text)

    entities = [ent.text.lower() for ent in doc.ents]
    noun_phrases = [chunk.text.lower() for chunk in doc.noun_chunks]



    # Enhanced keywords for better classification
    medical_keywords = [
        "patient", "doctor", "hospital", "clinic", "medical", "health", "treatment",
        "diagnosis", "symptoms", "disease", "prescription", "medication", "healthcare",
        "physician", "nurse", "surgery", "examination", "laboratory", "test results",
        "medical history", "vital signs", "blood pressure", "heart rate"
    ]

    financial_keywords = [
        "invoice", "payment", "amount", "tax", "financial", "bank", "credit",
        "debit", "transaction", "balance", "account", "money", "price", "cost",
        "revenue", "profit", "expense", "budget", "investment", "statement",
        "billing", "purchase", "sale", "receipt"
    ]

    legal_keywords = [
        "contract", "agreement", "law", "legal", "court", "attorney", "clause",
        "party", "terms", "conditions", "rights", "obligations", "liability",
        "jurisdiction", "compliance", "regulation", "statute", "plaintiff",
        "defendant", "witness", "testimony", "evidence"
    ]

    resume_keywords = [
        "experience", "education", "skills", "work history", "employment",
        "qualification", "degree", "university", "college", "certification",
        "professional", "career", "job", "position", "responsibility",
        "achievement", "project", "team", "management", "leadership",
        "resume", "cv", "curriculum vitae", "reference", "objective"
    ]


    # Count occurrences of keywords
    word_freq = Counter(entities + noun_phrases)



    # Calculate scores with weighted importance
    scores = {
        'medical': sum(word_freq[word] * 2 if word in medical_keywords else 0 for word in word_freq),
        'financial': sum(word_freq[word] * 2 if word in financial_keywords else 0 for word in word_freq),
        'legal': sum(word_freq[word] * 2 if word in legal_keywords else 0 for word in word_freq),
        'resume': sum(word_freq[word] * 2 if word in resume_keywords else 0 for word in word_freq)
    }



    # Additional context analysis
    sentences = [sent.text.lower() for sent in doc.sents]



    # Enhanced contextual patterns
    for sent in sentences:
        # Medical patterns
        if any(pattern in sent for pattern in ['diagnosed with', 'medical history', 'treatment plan', 'prescribed']):
            scores['medical'] += 3

        # Financial patterns
        if any(pattern in sent for pattern in ['amount due', 'payment terms', 'invoice number', 'total amount']):
            scores['financial'] += 3

        # Legal patterns
        if any(pattern in sent for pattern in ['hereby agrees', 'terms and conditions', 'legal obligation', 'pursuant to']):
            scores['legal'] += 3

        # Resume patterns
        if any(pattern in sent for pattern in ['work experience', 'professional summary', 'educational background', 'career objective']):
            scores['resume'] += 3



    # Determine category with highest score
    max_score = max(scores.values())
    if max_score > 0:
        category = max(scores, key=scores.get)
    else:
        category = 'other'



    # Create vector embedding
    vector = sbert_model.encode([text])[0]
    
    return category, scores, vector



# Building of the FAISS index document with new vectors.
# FAISS - Facebook AI Similarity Search for vector similarity searching. 
def build_and_update_faiss_index(vectors, index_path):
    if os.path.exists(index_path):
        try:
            index = faiss.read_index(index_path)
            print(f"Existing index loaded from {index_path}")
        except Exception as e:
            print(f"Error loading existing index: {e}")
            print(f"Creating new index")
            dimension = vectors.shape[1]
            index = faiss.IndexFlatL2(dimension)
    else:
        print(f"No existing index found at {index_path}")
        dimension = vectors.shape[1]
        index = faiss.IndexFlatL2(dimension)
    
    index.add(vectors)
    faiss.write_index(index, index_path)
    print(f"Index updated and written to {index_path}")
    return index



# Visualization of the FAISS index using t-SNE for better understanding of the distances which is used to find similar documents.
def visualize_faiss_index(index_path):
    if os.path.exists(index_path):
        try:
            index = faiss.read_index(index_path)
            print(f"Index loaded successfully from {index_path}")
            print(f"Number of vectors in the index: {index.ntotal}")
            print(f"Dimensionality of the vectors: {index.d}")

            vectors = np.zeros((index.ntotal, index.d), dtype=np.float32)
            index.reconstruct_n(0, index.ntotal, vectors)

            # Adjust perplexity based on number of samples
            n_samples = vectors.shape[0]
            perplexity = min(30, n_samples - 1)  # Default is 30, but must be less than n_samples
            
            tsne = TSNE(
                n_components=2,
                random_state=42,
                perplexity=perplexity,
                n_iter=1000,
                learning_rate='auto'
            )
            
            # Only perform t-SNE if we have enough samples
            if n_samples > 2:
                reduced_vectors = tsne.fit_transform(vectors)

                plt.figure(figsize=(10, 8))
                plt.scatter(reduced_vectors[:, 0], reduced_vectors[:, 1], alpha=0.5)
                plt.title(f"t-SNE Visualization of Document Vectors (n={n_samples})")
                plt.xlabel("t-SNE Dimension 1")
                plt.ylabel("t-SNE Dimension 2")
                
                # Add labels for each point
                for i in range(n_samples):
                    plt.annotate(f"Doc {i+1}", (reduced_vectors[i, 0], reduced_vectors[i, 1]))
                
                plt.show()
            else:
                print("Not enough samples for t-SNE visualization (minimum 3 required)")

        except Exception as e:
            print(f"Error visualizing FAISS index: {e}")
            print(traceback.format_exc())



# Final Function for uploading and classifying the documents.            
def upload_and_classify_documents():
    pdf_files = [
        'docsdata/medical1.pdf',
        'docsdata/medical2.pdf',
        'docsdata/medical3.pdf',
        'docsdata/invoice1.pdf',
        'docsdata/invoice2.pdf',
        'docsdata/invoice3.pdf',
        'docsdata/invoice4.pdf',
        'docsdata/invoice5.pdf',
        'docsdata/invoice6.pdf',
        'docsdata/invoice7.ddf',
        'docsdata/legal1.pdf',
        'docsdata/legal2.pdf',
        'docsdata/legal3.pdf',
        'docsdata/legal4.pdf',
        'docsdata/legal5.pdf',
        'docsdata/legal6.pdf',
        'docsdata/legal7.pdf',
        'docsdata/legal8.pdf',
        'docsdata/resume1.pdf',
        'docsdata/resume2.pdf',
        'docsdata/resume3.pdf',
        'docsdata/resume4.pdf',
    ]

    print(f"\nProcessing {len(pdf_files)} PDF files")

    total_scores = {
        'medical': 0,
        'financial': 0,
        'legal': 0,
        'resume': 0,
        'other': 0
    }

    all_vectors = []
    all_file_names = []
    index_path = "document_index.faiss" # FAISS file
    results = []

    for file_name in pdf_files: 
        print(f"\nProcessing {file_name}...")
        
        try:
            if os.path.exists(file_name):
                text = extract_text_from_pdf(file_name) # Reading text from PDF
                category, scores, vector = analyze_text(text) # Analyzing the text
                print(f"Classified as {category}")
                
                doc = spacy.load("en_core_web_sm")(text)
                print(f"Key entities found: {', '.join(set([ent.text for ent in doc.ents][:5]))}")
                
                for key, value in scores.items():
                    total_scores[key] += value

                base_dir = 'classified_docs'
                new_path = os.path.join(base_dir, category, os.path.basename(file_name))
                final_path = safe_move_file(file_name, new_path)
                print(f"Moved to local folder: {final_path}")
                
                all_vectors.append(vector)
                all_file_names.append(os.path.basename(file_name))
                
                print(f"Successfully processed {file_name} as {category}")
            else:
                print(f"File not found: {file_name}")
            
        except Exception as e:
            print(f"Error processing file {file_name}: {e}")
            print(traceback.format_exc())

    if all_vectors:
        vectors_array = np.array(all_vectors)
        index = build_and_update_faiss_index(vectors_array, index_path)
        print(f"Updated FAISS index with {len(all_vectors)} new documents")

        try:
            for i, file_name in enumerate(all_file_names):
                query_vector = np.array([all_vectors[i]])
                distances, indices = index.search(query_vector, 3)

                similar_documents = []
                for j, idx in enumerate(indices[0]):
                    if idx != i and 0 <= idx < len(all_file_names):
                        similar_documents.append({
                            "similar_document": all_file_names[idx],
                            "distance": distances[0][j]
                        })

                file_path = os.path.join('classified_docs', category, file_name)
                result = DocumentResult(file_path, category, scores, similar_documents)
                results.append(result)

        except Exception as e:
            print(f"Error performing similarity search: {e}")
            print(traceback.format_exc())

    print("\nSummary of classification scores:")
    for category, score in total_scores.items():
        print(f"{category}: {score}")

    print("\nDetailed Results:")
    for result in results:
        print(result)

    visualize_faiss_index(index_path)


def main():
    print("Starting document upload and classification process...")
    create_folders()
    print("Created classification folders")
    upload_and_classify_documents()
    print("\nDocument processing completed")

if __name__ == "__main__":
    main()
