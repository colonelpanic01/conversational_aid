import json
from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import ClientError
import redis
import os

# Flask app initialization
app = Flask(__name__)

# Improved AWS credential handling (environment variables or secure storage)
def get_aws_credentials(filename, line_number):
    try:
        with open(filename, 'r') as file:
            lines = file.readlines()
            if 1 <= line_number <= len(lines):
                line = lines[line_number - 1].strip()
                parts = line.split('=')
                if len(parts) == 2:
                    return parts[1].strip()
                else:
                    return None
            else:
                return None
    except FileNotFoundError:
        print(f"Error: File '{filename}' not found.")
        return None
    except Exception as e:
        print(f"Error reading from file: {e}")
        return None

aws_access_key_id = get_aws_credentials("api.txt", 2)
aws_secret_access_key = get_aws_credentials("api.txt", 3)

print(f"{aws_access_key_id} and {aws_secret_access_key}")

if not aws_access_key_id or not aws_secret_access_key:
    print("Error: AWS credentials not found. Please set environment variables or use a secure storage mechanism.")
    exit(1)

# Configure DynamoDB client
dynamodb = boto3.resource(
    'dynamodb',
    region_name='us-east-2',  # Set the region as needed
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key
)
table = dynamodb.Table('PersonProfiles')  # Replace with your DynamoDB table name

# Configure Redis client (optional, for caching)
redis_client = redis.Redis(host='localhost', port=6379)  # Adjust host/port if needed

# API endpoint to get a user by user_id
@app.route('/profiles/<user_id>', methods=['GET'])
def get_user(user_id):
    try:
        # Check Redis cache for user data (optional)
        cached_data = redis_client.get(user_id)
        if cached_data:
            return jsonify(json.loads(cached_data))  # Return cached data if available

        # Fetch data from DynamoDB if not cached
        response = table.get_item(Key={'user_id': user_id})
        if 'Item' in response:
            item = response['Item']
            # Update Redis cache (optional)
            redis_client.set(user_id, json.dumps(item), ex=3600)  # Cache for 1 hour
            return jsonify(item)
        else:
            return jsonify({"error": "User not found"}), 404
    except ClientError as e:
        return jsonify({"error": str(e)}), 500

# API endpoint to write data to DynamoDB
@app.route('/profiles', methods=['POST'])
def write_to_db():
    data = request.get_json()

    if 'user_id' not in data or 'data' not in data:
        return jsonify({"error": "Missing required fields: user_id and data"}), 400

    user_id = data['user_id']
    user_data = data['data']

    try:
        table.put_item(Item={'user_id': user_id, 'data': user_data})
        # Invalidate Redis cache (optional)
        redis_client.delete(user_id)  # Remove cached data for the updated user
        return jsonify({"message": "Data written successfully"}), 201
    except ClientError as e:
        return jsonify({"error": str(e)}), 500

# Start the Flask app
if __name__ == '__main__':
    app.run(debug=True)