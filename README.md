# ugv_test_assignment

This is a Vue 3 + TypeScript interface prototype for controlling an Unmanned Ground Vehicle (UGV). It features map integration, engine control, directional movement via keyboard, and waypoint handling.

## Project Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v14.18+ recommended)
- npm (comes with Node.js)

### Installation

Clone the repository:

```bash
git clone https://github.com/sandersirge/ugv_test_assignment.git
cd ugv_test_assignment
```

Install dependencies:

```bash
npm install
```

Compile and Hot-Reload for Development:

```bash
npm run dev
```

Or compile for Production:

```bash
npm run build
```

Visit the given URL in your browser to see the project.

## Documentation

### Features

1. Interactive map with UGV marker

2. Keyboard controls for rotation and movement

3. Engine toggle to enable or disable movement

4. Add, name, and delete waypoints

5. Waypoints are saved in local storage.

### Challenges during development

1) Calculating precise UGV movement using heading and geographic distance

2) Implementing the waypoint manipulation and UGV control

3) Enforcing engine control before movement

4) Keeping UGV's marker rotation accurate and responsive on the map

### Usage

The initial location is in the city of Tallinn.

Make sure the engine is started before moving by clicking the button in the upper right corner!

Use arrow keys to control the UGV, which is marked by an arrow inside a circle. Arrow points to the direction of current heading (where the front of the vehicle is pointed). Up and down arrow keys are for forward/reversing movement respectively by approximately 5 meters. During this the front will stay pointed to the same heading. Left and right arrow keys are for turning the UGV left or right by 3 degrees. You can also hold down arrow keys for longer continuous movement.

Long press on the map to add a temporary waypoint. Save or discard it using the popup.

Manage saved waypoints in the list on the interface.

The videos are under the demo directory in project's root. First one showcases all of the key deliverables and the second one briefly shows how after refreshing the page, runtime waypoints will stay.
