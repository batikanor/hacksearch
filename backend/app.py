from flask import Flask, jsonify, request
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes and origins

# Store location data—here we store three random numbers for each location
location_messages = {}

@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify(message="Click anywhere on the globe to get started!"), 200

@app.route('/api/location', methods=['POST'])
def handle_location():
    data = request.get_json()
    lat = data.get('lat')
    lng = data.get('lng')
    
    # Create a unique key based on latitude and longitude
    location_key = f"{lat:.4f},{lng:.4f}"
    if location_key not in location_messages:
        # Generate 3 random numbers for this location
        random_numbers = [random.randint(1, 100) for _ in range(3)]
        location_messages[location_key] = random_numbers
    else:
        random_numbers = location_messages[location_key]
    
    return jsonify({
        'numbers': random_numbers
    })

@app.route('/api/location/<float:lat>/<float:lng>', methods=['GET'])
def get_location_numbers(lat, lng):
    location_key = f"{lat:.4f},{lng:.4f}"
    numbers = location_messages.get(location_key)
    if numbers is None:
        return jsonify({'numbers': []})
    return jsonify({'numbers': numbers})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)