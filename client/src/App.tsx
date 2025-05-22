import { useEffect, useState, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import axios from 'axios';

interface CyNode {
  data: {
    id: string;
    label: string;
    clock: string;
    eventId: string;
  };
  position?: {
    x: number;
    y: number;
  };
}

interface CyEdge {
  data: {
    id: string;
    source: string;
    target: string;
    label: string;
  };
}

interface EventNode {
  uid: string;
  'event.id': string;
  'event.name': string;
  'event.clock': string;
  'event.depth': number;
  'event.parent'?: Array<{
    uid: string;
    'event.id': string;
    'event.name': string;
  }>;
}

const DGRAPH_URL = 'http://localhost:8080/query';

const query = `{
  events(func: has(event.id)) {
    uid
    event.id
    event.name
    event.clock
    event.depth
    event.parent {
      uid
      event.id
      event.name
    }
  }
}`;

const generateInitialPositions = (count: number, radius: number = 300) => {
  const positions = [];
  const center = { x: 500, y: 400 };
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI;
    positions.push({
      x: center.x + radius * Math.cos(angle) + (Math.random() * 100 - 50),
      y: center.y + radius * Math.sin(angle) + (Math.random() * 100 - 50)
    });
  }
  
  return positions;
};

export default function Chronograph() {
  const [elements, setElements] = useState<(CyNode | CyEdge)[]>([]);
  const cyRef = useRef<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post(DGRAPH_URL, query, {
          headers: { 'Content-Type': 'application/dql' },
        });
        const events: EventNode[] = response.data.data.events;
        
        const positions = generateInitialPositions(events.length);

        const nodes: CyNode[] = events.map((event, index) => ({
          data: {
            id: event.uid,
            label: event['event.name'],
            clock: event['event.clock'],
            eventId: event['event.id']
          },
          position: positions[index],
        }));

        const edges: CyEdge[] = events.flatMap((event) =>
          (event['event.parent'] || []).map((parent) => ({
            data: {
              id: `${parent.uid}->${event.uid}`,
              source: parent.uid,
              target: event.uid,
              label: 'event.parent'
            }
          }))
        );

        setElements([...nodes, ...edges]);
      } catch (err) {
        console.error('Failed to fetch from Dgraph:', err);
      }
    };

    fetchData();
  }, []);

  const getCyRef = (cy: any) => {
    cyRef.current = cy;
    
    cy.style()
      .selector('node')
      .style({
        'background-color': '#2196f3',
        'width': '90px',
        'height': '90px',
        'border-width': 0,
        'shape': 'ellipse',
        'color': 'white',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': '14px',
        'text-wrap': 'wrap',
        'text-max-width': '80px',
        'label': 'data(label)',
        'text-outline-width': 1,
        'text-outline-color': '#1976d2',
        'shadow-blur': 10,
        'shadow-color': 'rgba(0,0,0,0.2)',
        'shadow-opacity': 0.8,
        'cursor': 'grab'
      })
      .selector('edge')
      .style({
        'width': 2,
        'line-color': '#88be88',
        'target-arrow-color': '#88be88',
        'target-arrow-shape': 'triangle',
        'arrow-scale': 1.5,
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '10px',
        'color': '#88be88',
        'text-opacity': 0.8,
        'text-rotation': 'autorotate',
        'text-margin-y': -10,
      })
      .update();
    
    const layout = cy.layout({
      name: 'preset',
      fit: true,
      padding: 75
    });
    layout.run();
    
    setInterval(() => {
      cy.nodes().forEach((node: any) => {
        const offset = Math.random() * 2 - 1;
        node.position('x', node.position('x') + offset);
        node.position('y', node.position('y') + offset);
      });
    }, 3000);
    
    cy.on('drag', 'node', function(evt: any) {
      const node = evt.target;
      console.log('Node is being dragged:', node.id());
    });
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #f7f9fc 0%, #e8f0fe 100%)',
      position: 'relative'
    }}>
      {elements.length > 0 && (
        <CytoscapeComponent
          elements={elements}
          style={{ width: '100%', height: '100%' }}
          cy={getCyRef}
          layout={{ name: 'preset' }}
          stylesheet={[
            {
              selector: 'node',
              style: {
                'background-color': '#2196f3',
              }
            }
          ]}
          minZoom={0.2}
          maxZoom={2}
        />
      )}
      {elements.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '16px',
          color: '#555'
        }}>
          Loading event graph...
        </div>
      )}
    </div>
  );
}
