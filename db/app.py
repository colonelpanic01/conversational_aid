from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import ClientError
import redis

app = Flask(__name__)

redis_client = redis.Redis()

# Configure DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')  # Set the region as needed
table = dynamodb.Table('PersonProfiles')  # Replace with your DynamoDB table name

# API endpoint to get a user by user_id
@app.route('/profiles', methods=['GET'])
def get_user():
    try:
        response = table.scan()
        if 'Items' in response:
            return response['Items']
        else:
            return jsonify({"error": "User not found"}), 404
    except ClientError as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/process', methods=['POST'])
def write_to_db():
    data = request.get_json()
    text = data['text']
    
    
    

# Start the Flask app
if __name__ == '__main__':
    app.run(debug=True)
