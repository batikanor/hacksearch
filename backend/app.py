from flask import Flask, jsonify, request
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes and origins

# Store location messages in memory (you might want to use a database in production)
location_messages = {}

@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify(message="Click anywhere on the globe to get started!"), 200

@app.route('/api/location', methods=['POST'])
def handle_location():
    data = request.get_json()
    lat = data.get('lat')
    lng = data.get('lng')
    
    # Create a unique key for this location
    location_key = f"{lat:.4f},{lng:.4f}"
    if location_key not in location_messages:
        # Generate a random number and include it in the message when this location is first marked
        random_number = random.randint(1, 100)
        message = f"Location marked at ({lat:.2f}, {lng:.2f}) - Random Number: {random_number}"
        location_messages[location_key] = message
    else:
        message = location_messages[location_key]
    
    return jsonify({
        'message': message
    })

@app.route('/api/location/<float:lat>/<float:lng>', methods=['GET'])
def get_location_message(lat, lng):
    location_key = f"{lat:.4f},{lng:.4f}"
    message = location_messages.get(location_key, f"No message for location ({lat:.2f}, {lng:.2f})")
    return jsonify({'message': message})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
