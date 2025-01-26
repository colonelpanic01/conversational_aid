import google.generativeai as genai

def read_first_line(filename):
  try:
      with open(filename, 'r') as file:
        first_line = file.readline()
        if not first_line:
          return None

        parts = first_line.strip().split('=', 1)
        if len(parts) == 2:
          return parts[1].strip()
        else:
          print(f"Warning: '=' not found in the first line of '{filename}'.")
          return None
  except FileNotFoundError:
    print(f"Error: File '{filename}' not found.")
    return None



gemini_api_key = read_first_line("api.txt")
# Replace with your actual API key
genai.configure(api_key=gemini_api_key)

model = genai.GenerativeModel('gemini-1.5-flash-latest') 



def checkSpeker(firstSens):
  prompt = "Give me the name of the speker who isn't the user or User and only that: " + firstSens
  response = model.generate_content(prompt)
  return response.text

def makeCurrentSumamry(prompt, name): 
  response = model.generate_content(f"Summaries this in maximum 10 bullet points that has to do with {name} and only the bullet points: {prompt}")
  return response.text
  
def makeUpdateSumamry(prompt, context, speakerName):
  response = model.generate_content(f"Update: {context}; keeping {speakerName} in mind and and Person2 is {speakerName} using: {prompt}")
  return response.text
  
def makeHistoricSumamry(histroy, new): 
  prompt = "Summaries this in 10 bullet points and only give bullet points: " + histroy + new
  response = model.generate_content(prompt)
  return response.text
