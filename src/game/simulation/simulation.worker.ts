import { Simulation } from './simulation';

const simulation = new Simulation();

onmessage = (e) => {
  console.log('simulation.worker received message:', e.data);
};
