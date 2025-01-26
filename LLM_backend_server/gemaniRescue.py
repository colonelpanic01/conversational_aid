import google.generativeai as genai

def getKey(filename):
  try:
      with open(filename, 'r') as file:
        first_line = file.readline()
        if not first_line:
          return None 

        parts = first_line.strip().split('=', 1) 
        return parts[1]
  except FileNotFoundError:
    print(f"Error: File '{filename}' not found.")
    return None
  except IndexError:
    print("Error: '=' not found in the first line.")
    return None
  
key = getKey("api.txt")
gemini_api_key = key 
genai.configure(api_key=gemini_api_key)
model = genai.GenerativeModel('gemini-1.5-flash-latest') 

def getResponceCurrent(data):
  prompt = "Summaries the given data into 5 to 10 bullet points each seprated by a comma: " + data
  response = model.generate_content(prompt)

  return response

def getNewSummary(oldSummary, currentConvo):
  prompt = "sumaries convesations into 10 bullet points using the following data: " + oldSummary + currentConvo
  response = model.generate_content(prompt)

  return response