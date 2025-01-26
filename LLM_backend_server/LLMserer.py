import gemaniRescue
import os
# It will be used to store the whole conversation
memory = ""

# It will be used to store all people who pop up in the conversation
def read_key_value_pairs_from_file(file_path):
    try:
        with open(file_path, 'r') as file:
            data = file.readlines()

            key_value_pairs = {}
            for line in data:
                try:
                    key, *value_parts = line.strip().split(":")  # Split by the first colon
                    value = " ".join(value_parts).strip()  # Join value parts and remove leading/trailing spaces
                    key_value_pairs[key.strip()] = value
                except ValueError:
                    print(f"Invalid line format: {line}")
                    continue

        return key_value_pairs

    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return {}

firstTime = True
speakerName = " "

def updatePromt(filename, line_number):
    try:
        with open(filename, 'r') as file:
            lines = file.readlines()
            if 1 <= line_number <= len(lines):
                return lines[line_number - 1].strip()  # Strip newline characters
            else:
                return None
    except FileNotFoundError:
        print(f"Error: File '{filename}' not found.")
        return None
    except ValueError as e:
        print(f"Error: {e}") 
        return None


def create_or_overwrite_file(file_name, data):
    # Check if the file exists
    if os.path.exists(file_name):
        print(f'File "{file_name}" exists. Overwriting...')
    else:
        print(f'File "{file_name}" does not exist. Creating a new file...')

    # Open the file in write mode (creates if not exists, overwrites if exists)
    with open(file_name, 'w') as file:
        file.write(data)
        print(f'File "{file_name}" successfully written.')

histroy = ""
count = 0

my_dict = read_key_value_pairs_from_file("./firbaseDB/server.txt")

while(True):
    count += 1
    
    prompt = updatePromt("talk.txt", count)
    count += 1
    if prompt is None:
        break
    prompt = prompt.strip()
    memory += prompt
    if firstTime:
        speakerName = gemaniRescue.checkSpeker(prompt).lower().strip()
        firstTime = False
        histroy = my_dict[speakerName]
        my_dict[speakerName] = gemaniRescue.makeCurrentSumamry(memory, speakerName)
        print(my_dict[speakerName])
    my_dict[speakerName] = gemaniRescue.makeUpdateSumamry(memory, my_dict[speakerName], speakerName)

my_dict[speakerName] = gemaniRescue.makeHistoricSumamry(histroy, memory)
create_or_overwrite_file(f"./LLM_backend_server/ContactData/{speakerName}.txt", my_dict[speakerName])

for key in my_dict:
    if key != speakerName:
        my_dict[key] = gemaniRescue.makeCurrentSumamry(memory, key)
        if my_dict[key] is not None and "\n" not in key:
            print(f"{key} = {my_dict[key]}")
            create_or_overwrite_file(f"./LLM_backend_server/ContactData/{key}.txt", my_dict[key])
    