import cohere
import os
from dotenv import load_dotenv

load_dotenv()
cohere_token = os.getenv('COHERE_TOKEN')
co = cohere.Client(cohere_token)

exampleConvo = """
    Alex: Hey, nice to meet you! I'm Alex.
    Jordan: Hey Alex, nice to meet you too! I'm Jordan.
    Alex: So, tell me about yourself! What do you do?
    Jordan: Well, I work as a software developer. I love coding and building new things, especially when it comes to AI and automation. How about you?
    Alex: That’s awesome! I’m a graphic designer. I love creating visuals and working on branding projects. Lately, I’ve been getting into motion graphics too.
    Jordan: Oh, that’s cool! I’ve always admired people who can do design—it’s such a creative skill. Do you freelance, or do you work for a company?
    Alex: I do a bit of both! I have a full-time job at a design agency, but I take on freelance projects on the side. It keeps things interesting.
    Jordan: That sounds like a great balance. I sometimes do freelance work too, mostly on web development projects. It’s nice having that creative freedom outside of a 9-to-5 job.
    Alex: Yeah, exactly! So, what do you do for fun when you’re not coding?
    Jordan: I love hiking and playing the guitar. Being outdoors helps me clear my mind, and music has always been my way to unwind. What about you?
    Alex: That’s cool! I’m really into photography and traveling. I love capturing different places and cultures through my camera.
    Jordan: That sounds amazing! Do you have a dream travel destination?
    Alex: Definitely Japan! I love the mix of traditional and modern culture there. How about you?
    Jordan: Japan is on my list too! But if I had to pick just one, I’d say New Zealand. The landscapes there look unreal.
    Alex: Good choice! Maybe one day we’ll both make it to our dream destinations.
    Jordan: Hopefully! Until then, we’ll just keep working and dreaming.
"""

response = co.chat(
    message=f"This text represents a conversation between two individuals, summarize key details about Jordan in bullet points\n{exampleConvo}"
).text

print(response)