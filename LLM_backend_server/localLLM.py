import torch
from llama import Llama

# Check if MPS (Metal Performance Shaders) is available
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

# Load the model and move it to the MPS device
model = Llama.load_from_checkpoint('path_to_downloaded_model').to(device)

# Tokenizer for encoding and decoding text
tokenizer = model.tokenizer

# Example conversation
conversation = "User: What's the weather today?\nBot: The weather is sunny with a slight chance of rain."

# Tokenize input
inputs = tokenizer(conversation, return_tensors="pt").to(device)  # Move inputs to GPU (MPS)

# Generate output
outputs = model.generate(inputs['input_ids'], max_length=200, num_return_sequences=1)

# Decode the output
summary = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(summary)
