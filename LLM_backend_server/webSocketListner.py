import asyncio
import websockets
import os

async def handler(websocket, path):
    try:
        while True:
            # Receive the filename from the client
            filename = await websocket.recv() 

            # Read the file content
            with open(filename, 'r') as f:
                file_content = f.read()

            # Send the file content to the client
            await websocket.send(file_content) 

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")

async def main():
    async with websockets.serve(handler, "localhost", 8765):
        await asyncio.Future()  # run_forever() is deprecated and will be removed in Python 3.11

asyncio.run(main())