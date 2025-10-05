# Pool simulator

Play pool in your browser

## TODO

### Gameplay

- Fully implement 8 ball
- ~~Switch turns~~
- Snooker?
- ~~Show balls pocketed~~`
- Show curve after first contact
- ~~Aim assist - first contact~~

### Physics

- ~~Implement spin (side & top)~~
- ~~Implement masse~~
- ~~Event-based evolution~~ not worth
- ~~Revisit physics values~~
- ~~Fix ball entering pocket physics~~
- ~~Substep collision resolution~~
  - ~~Substep cushion collisions~~
- ~~Runtime physics param changes~~

### Graphics

- Finish table model
  - Body / legs
  - Pocket graphics
- Background / skybox
- ~~Redo cushion geometries~~
  - Maybe round cushion physics corners
- Fix pocket liners/openings

### AI

- ~~Optimise~~
- ~~Randomise break~~
- ~~Only check down the table on break~~
- Better shot scoring
  - Consider collisions before/after target ball struck
  - Score shots higher that look like they had intention
- Behaviour customization
  - Trickshot preference
  - Accuracy / mistakes

### Multiplayer

- ~~Add online multiplayer~~
- ~~Custom games (custom properties)~~
- Private lobbies
- Better interactions
  - Notifications
- Handle disconnects better
- Lerp ball in hand
- Fix host shot sending
- Fix sending cue updates with locked cue
- Unlock cue one state change
