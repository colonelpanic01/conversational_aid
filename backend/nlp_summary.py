import nltk
from transformers import pipeline

nltk.download('punkt')

def generate_summary(transcripts, max_length=50, min_length=20):
    # Combine transcripts into single text
    full_text = ' '.join(transcripts)
    
    # Use Hugging Face summarization pipeline
    summarizer = pipeline("summarization")
    
    try:
        summary = summarizer(
            full_text, 
            max_length=max_length, 
            min_length=min_length, 
            do_sample=False
        )[0]['summary_text']
        
        return summary
    except Exception as e:
        print(f"Summary generation error: {e}")
        return "Unable to generate summary"