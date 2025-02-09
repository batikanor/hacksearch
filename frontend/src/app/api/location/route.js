import { NextResponse } from 'next/server';

let agentId = null;
let runId = null;

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Create agent instance if it doesn't exist
    if (!agentId || !runId) {
      const createResponse = await fetch('https://rev1wm2p.clj5khk.gcp.restack.it/api/agents/AgentLocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      if (!createResponse.ok) {
        throw new Error(`Failed to create agent: ${createResponse.status}`);
      }
      
      const result = await createResponse.json();
      agentId = result.agentId;
      runId = result.runId;
    }

    // Send location event to existing agent
    const eventResponse = await fetch(`https://rev1wm2p.clj5khk.gcp.restack.it/api/agents/AgentLocation/${agentId}/${runId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName: 'location',
        eventInput: {
          lat: data.lat,
          lng: data.lng
        }
      })
    });

    if (!eventResponse.ok) {
      throw new Error(`Failed to send event: ${eventResponse.status}`);
    }

    const result = await eventResponse.json();
    console.log('Restack response:', result);
    
    // Properly format the hackathons array
    const hackathons = Array.isArray(result) ? result.map(event => ({
      name: event.name || "Local Hackathon",
      description: event.description || `Event details`,
      location: event.location || `${data.lat}, ${data.lng}`,
      date: event.date || "TBA"
    })) : [];
    
    return NextResponse.json({ hackathons });
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Fallback to Flask backend if Restack fails
    try {
      const flaskResponse = await fetch('http://backend:5000/api/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: data.lat,
          lng: data.lng
        })
      });

      const flaskResult = await flaskResponse.json();
      return NextResponse.json(flaskResult);
    } catch (flaskError) {
      return NextResponse.json({ error: 'All backends failed' }, { status: 500 });
    }
  }
} 