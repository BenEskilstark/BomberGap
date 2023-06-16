const {isHost} = require('./selectors/sessions');
const {subtract, vectorTheta} = require('bens_utils').vectors;

const render = (state) => {
  const game = state.game;
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, game.worldSize.width, game.worldSize.height);

  // fog
  for (const loc of game.fogLocations) {
    ctx.fillStyle = "steelblue";
    ctx.beginPath();
    ctx.arc(loc.position.x, loc.position.y, loc.vision, 0, 2*Math.PI);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(100,100,100, 0.75)';
  ctx.fillRect(0, 0, game.worldSize.width, game.worldSize.height);
  for (const entityID in game.entities) {
    const entity = game.entities[entityID];
    if (entity.clientID != state.clientID) continue;
    ctx.fillStyle = "steelblue";
    ctx.beginPath();
    ctx.arc(entity.position.x, entity.position.y, entity.vision, 0, 2*Math.PI);
    ctx.closePath();
    ctx.fill();
  }

  for (const entityID in game.entities) {
    const entity = game.entities[entityID];

    if (entity.type == 'EXPLOSION') {
      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.arc(
        entity.position.x, entity.position.y,
        entity.maxRadius * entity.age / entity.duration,
        0, 2*Math.PI,
      );
      ctx.closePath();
      ctx.fill();
      continue;
    }

    ctx.save();
    ctx.fillStyle = "blue";
    let isBluePlayer = true;
    if (
      (!isHost(state) && entity.clientID == state.clientID) ||
      (isHost(state) && entity.clientID != state.clientID)
    ) {
      isBluePlayer = false;
      ctx.fillStyle = "red";
    }

    let width = 4;
    let height = 4;
    let shape = 'circle'; // default shape is circle
    if (entity.type === 'AIRBASE') {
      width = 16;
      height = 8;
      shape = 'square';
    } else if (entity.type == 'FACTORY') {
      width = 16;
      shape = 'factory';
    } else if (entity.type == 'LAB') {
      width = 16;
      height = 16;
      shape = 'lab';
    } else if (entity.type == 'CITY') {
      width = 8;
      height = 16;
      shape = 'city';
    } else if (entity.isFighter) {
      width = 7;
      height = 7;
      shape = 'triangle';
    } else if (entity.isBomber) {
      height = 8;
      shape = 'square';
    } else if (entity.isPlane) {
      width = 6;
    }

    // rotate
    ctx.translate(entity.position.x, entity.position.y);
    if (entity.targetEnemy != null && game.entities[entity.targetEnemy]) {
      const target = game.entities[entity.targetEnemy];
      ctx.rotate(vectorTheta(subtract(target.position, entity.position)));
    } else if (entity.targetPos != null) {
      ctx.rotate(vectorTheta(subtract(entity.targetPos, entity.position)));
    }
    ctx.translate(-1 * entity.position.x, -1 * entity.position.y);

    if (game.selectedIDs.includes(entityID)) {
      // fuel remaining
      if (entity.fuel && entity.clientID == state.clientID) {
        ctx.strokeStyle = "#7CFC00";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(entity.position.x, entity.position.y, entity.fuel, 0, 2*Math.PI);
        ctx.closePath();
        ctx.stroke();
      }
    }
    const noAmmo = (entity.ammo == 0 && (entity.isFighter || entity.isBomber));
    const isSelected = game.selectedIDs.includes(entityID);

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'gold';
    if (noAmmo && isBluePlayer)  {
      ctx.strokeStyle = 'red';
    } else if (isBluePlayer && entity.isBuilding && !isSelected) {
      ctx.strokeStyle = 'blue';
    }
    if (noAmmo && !isBluePlayer) {
      ctx.strokeStyle = 'black';
    } else if (!isBluePlayer && entity.isBuilding && !isSelected) {
      ctx.strokeStyle = 'red';
    }

    switch (shape) {
      case 'square':
        ctx.fillRect(entity.position.x - width / 2, entity.position.y - height / 2, width, height);
        if (noAmmo || isSelected) {
          ctx.beginPath();
          ctx.rect(entity.position.x - width / 2, entity.position.y - height / 2, width, height);
          ctx.closePath();
          ctx.stroke();
        }
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(entity.position.x, entity.position.y, width / 2, 0, 2*Math.PI);
        ctx.closePath();

        if (noAmmo || isSelected) {
          ctx.stroke();
        }
        ctx.fill();
        break;
      case 'triangle':
        // rotate an additional 90 degrees
        ctx.translate(entity.position.x, entity.position.y);
        ctx.rotate(Math.PI / 2);
        ctx.translate(-1 * entity.position.x, -1 * entity.position.y);

        ctx.beginPath();
        ctx.moveTo(entity.position.x, entity.position.y - height / 2);
        ctx.lineTo(entity.position.x + width / 2, entity.position.y + height / 2);
        ctx.lineTo(entity.position.x - width / 2, entity.position.y + height / 2);
        ctx.closePath();

        // unrotate
        ctx.translate(entity.position.x, entity.position.y);
        ctx.rotate(-Math.PI / 2);
        ctx.translate(-1 * entity.position.x, -1 * entity.position.y);

        if (noAmmo || isSelected) {
          ctx.stroke();
        }
        ctx.fill();
        break;
      case 'factory':
        ctx.translate(entity.position.x, entity.position.y);
        ctx.beginPath();
        ctx.moveTo(-width / 2, width / 2);
        ctx.lineTo(-width / 2, -width / 2); // left wall
        ctx.lineTo(-width / 4, -width / 4); // first diagonal
        ctx.lineTo(-width / 4, -width / 2);
        ctx.lineTo(0, -width / 4); // second diagonal
        ctx.lineTo(0, -width / 2);
        ctx.lineTo(width / 4, -width / 4); // third diagonal
        ctx.lineTo(width / 4, -width / 2);
        ctx.lineTo(width / 2, -width / 4); // fourth diagonal
        ctx.lineTo(width / 2, width / 2); // right wall
        ctx.closePath(); // bottom
        ctx.translate(-1 * entity.position.x, -1 * entity.position.y);

        if (isSelected) {
          ctx.stroke();
        }
        ctx.fill();

        break;
      case 'city':
        ctx.fillRect(entity.position.x - width / 2, entity.position.y - height / 2, width, height);
        if (isSelected) {
          ctx.beginPath();
          ctx.rect(entity.position.x - width / 2, entity.position.y - height / 2, width, height);
          ctx.closePath();
          ctx.stroke();
        }
        break;
      case 'lab':

        ctx.beginPath();
        ctx.moveTo(entity.position.x, entity.position.y - height / 2);
        ctx.lineTo(entity.position.x + width / 2, entity.position.y + height / 2);
        ctx.lineTo(entity.position.x - width / 2, entity.position.y + height / 2);
        ctx.closePath();

        if (isSelected) {
          ctx.stroke();
        }
        ctx.fill();
        break;
    }

    // upgraded buildings:
    if (entity.type == 'FACTORY') height *= 4;
    if (entity.type == 'CITY') {
      height *= 1.2;
      width *= 2;
    }
    if (entity.isHardened) {
      ctx.beginPath();
      ctx.arc(entity.position.x, entity.position.y, width, Math.PI - 0.1, 0.1);
      ctx.stroke();
    }
    if (entity.isMega) {
      ctx.beginPath();
      ctx.moveTo(entity.position.x - width, entity.position.y);
      ctx.lineTo(entity.position.x - width, entity.position.y + height / 2);
      ctx.lineTo(entity.position.x + width, entity.position.y + height / 2);
      ctx.lineTo(entity.position.x + width, entity.position.y);
      ctx.stroke();
    }


    ctx.restore(); // unrotate

    // add condition to render plane name
    if (state.game.showStats) {
      ctx.fillStyle = "white";
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(entity.name, entity.position.x, entity.position.y + height / 2 + 10);
    }

    // Target
    if (entity.targetEnemy != null && entity.clientID == state.clientID) {
      const target = game.entities[entity.targetEnemy];
      if (target) {
        ctx.strokeStyle = "gold";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(entity.position.x, entity.position.y);
        ctx.lineTo(target.position.x, target.position.y);
        ctx.closePath();
        ctx.stroke();
      }
    } else if (
      entity.targetPos != null &&
      entity.clientID == state.clientID
      // && game.selectedIDs.includes(entityID)
    ) {
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(entity.position.x, entity.position.y);
      ctx.lineTo(entity.targetPos.x, entity.targetPos.y);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // render marquee:
  if (state.game.marquee != null) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "gold";
    ctx.beginPath();
    const {x, y, width, height} = state.game.marquee;
    ctx.rect(x, y, width, height);
    ctx.closePath();
    ctx.stroke();
  }

}

module.exports = {
  render,
};
