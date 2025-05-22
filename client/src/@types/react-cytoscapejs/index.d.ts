declare module 'react-cytoscapejs' {
  import { Component } from 'react';
  
  interface CytoscapeComponentProps {
    elements: any[];
    style?: React.CSSProperties;
    cy?: (cy: any) => void;
    layout?: any;
    stylesheet?: any[];
    minZoom?: number;
    maxZoom?: number;
    wheelSensitivity?: number;
    autounselectify?: boolean;
    boxSelectionEnabled?: boolean;
    userZoomingEnabled?: boolean;
    userPanningEnabled?: boolean;
    autolock?: boolean;
    autoungrabify?: boolean;
    panningEnabled?: boolean;
    grabifyNodes?: boolean;
    [key: string]: any;
  }
  
  export default class CytoscapeComponent extends Component<CytoscapeComponentProps> {}
} 