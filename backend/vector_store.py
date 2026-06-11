import os
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_community.embeddings import HuggingFaceEmbeddings

# Initialize local HuggingFace embeddings
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# Create in-memory vector store
vector_store = InMemoryVectorStore(embeddings)

# Seed documents
documents = [
    Document(
        page_content="Sai Music Academy offers Carnatic Vocal, Hindustani Vocal, and Western Vocal disciplines.",
        metadata={"category": "courses", "sub_category": "vocals"}
    ),
    Document(
        page_content="Percussion disciplines offered: Mridangam, Tabla, Ghatam, Kanjira, Cajon, Morsing, and Konnakol (vocal percussion).",
        metadata={"category": "courses", "sub_category": "percussion"}
    ),
    Document(
        page_content="Melodic instruments taught: Veena, Violin, Flute, Keyboard, Guitar, Sitar, Mandolin, Saxophone, Harmonium, and Recorder.",
        metadata={"category": "courses", "sub_category": "instruments"}
    ),
    Document(
        page_content="Dance and Wellness classes: Bharatanatyam (classical Indian dance) and Yoga.",
        metadata={"category": "courses", "sub_category": "wellness"}
    ),
    Document(
        page_content="Membership plans: Beginner (INR 1,499/month, 14-day free trial), Intermediate (INR 2,999/month, 14-day trial), Advanced (INR 7,499/month, 7-day trial). Billed monthly or yearly (10% off).",
        metadata={"category": "pricing"}
    ),
    Document(
        page_content="Coupon codes available: SAI20 (20% off first month), TRIAL30 (extend trial 30 days), YEARLY10 (10% yearly discount).",
        metadata={"category": "discounts"}
    ),
    Document(
        page_content="Sai Music Academy location: HIG-44, New ASTC HUDCO, Hosur, Tamil Nadu, India. Coordinates: 12.7409, 77.8253. Phone/WhatsApp: +91 7200747726.",
        metadata={"category": "contact"}
    ),
    Document(
        page_content="Key features of Sai Music Academy: 1-on-1 live classes, personalized syllabus, homework assignments, virtual calendar, practice drone tool.",
        metadata={"category": "features"}
    )
]

# Add documents to vector store
vector_store.add_documents(documents)

def query_academy_db(query_text: str, k: int = 3):
    """Query the vector database for matching academy facts."""
    results = vector_store.similarity_search(query_text, k=k)
    return "\n".join([doc.page_content for doc in results])
