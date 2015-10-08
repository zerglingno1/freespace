/*
  
  NodeGame: Shooter
  Copyright (c) 2010 Ivo Wetzel.
  
  All rights reserved.
  
  NodeGame: Shooter is free software: you can redistribute it and/or
  modify it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  NodeGame: Shooter is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License along with
  NodeGame: Shooter. If not, see <http://www.gnu.org/licenses/>.
  
*/


var Shape2D = require('./polygon').Shape2D;
var Polygon2D = require('./polygon').Polygon2D;


// Actors ----------------------------------------------------------------------
// -----------------------------------------------------------------------------
var ActorPlayer = Shooter.Actor('player', 2);
ActorPlayer.baseShape = [[0, -12], [10, 12], [-10, 12], [0, -12]];
ActorPlayer.shape = new Shape2D(ActorPlayer.baseShape, 2.5);
ActorPlayer.shapeArmor = new Shape2D(ActorPlayer.baseShape, 6.5);

ActorPlayer.onCreate = function(data) {
    this.client = data.client;
    this.cid = this.client.id;
    this.$$.randomPosition(this, this.$$.sizePlayer);
    this.polygon = new Polygon2D(this.x, this.y, this.r, ActorPlayer.shape);
    
    // General
    this.hp = 15;
    this.r = (Math.random() * Math.PI * 2) - Math.PI;
    this.mr = 0;
    this.oldMr = 0;
    this.speed = 0;
    this.thrust = false;
    this.defense = 1400;
    this.defenseTime = this.getTime();
    this.defMode = true;
    
    // PowerUPS
    this.boost = false;
    this.boostTime = 0;
    
    this.shield = false;
    this.shieldTime = 0;
    this.shieldHP = 0;
    
    this.armor = false;
    this.armorDis = false;
    this.armorTime = 0;
    this.armorHP = 0;
    
    this.bomb = false;
    this.defender = null;
    
    this.camu = 0;
    this.camuFade = -1;
    this.camuTime = 0;
    
    this.missiles = 0;
    
    // Achievements
    this.damageTaken = 0;
    this.bulletsTaken = 0;
    this.moveTime = this.getTime();
    this.badTime = this.getTime();
    this.boosting = false;
    this.notMoved = false;
    this.master = false;
};

ActorPlayer.onUpdate = function() {
    this.r = this.$$.wrapAngle(this.r + this.mr);
    this.limitSpeed();
    this.x += this.mx;
    this.y += this.my;
    this.polygon.transform(this.x, this.y, this.r);
    this.$$.wrapPosition(this);
    
    // Not moving
    if (this.mx !== 0 || this.my !== 0) {
        this.moveTime = this.getTime();
    
    } else if (!this.notMoved && this.timeDiff(this.moveTime) > 15000) {
        this.$$.achievement(this, 'move');
        this.notMoved = true;
    }
    
    // Missiles
    if (this.client.achieveMissile >= 5) {
        this.$$.achievement(this, 'miss');
        this.client.achieveMissile -= 5;
    }
    
    // Kawai
    if (this.client.achieveKawaii >= 10) {
        this.$$.achievement(this, 'kawaii');
        this.client.achieveKawaii -= 10;
    }
    
    // Invincibility
    if (this.timeDiff(this.defenseTime) > 100 && this.defense > 0) {
        this.defense -= 100;
        this.update();
        this.defenseTime = this.getTime();
    }
    
    // Boosting achievement
    if (this.timeDiff(this.boostTime) > 1000 && this.speed < 4.25) {
        this.boosting = false;
    }
    
    // Shield
    if (this.shield && this.timeDiff(this.shieldTime) > 15000) {
        this.shieldHP = 0;
        this.shield = false;
    }
    
    // Armor
    if (this.armorDis && this.timeDiff(this.armorTime) > 500) {
        this.disableArmor();
    }
    
    // Speed
    if (this.boost && this.timeDiff(this.boostTime) > 12500) {
        if (this.boosting) {
            this.$$.achievement(this, 'boost');
        }
        this.boosting = false;
        this.boost = false;
        this.limitSpeed();
        this.update();
    }
    
    // Camouflage
    if (this.camu === 1) {
        this.client.achieveNinja = 0;
        if (this.camuFade >= 0) {
            this.camuFade -= 5;
            this.update();
        
        } else {
            this.camu = 2;
            this.camuTime = this.getTime();
            this.camuFade = -2;
            this.clients([this.cid]);
        }
    
    // Faded
    } else if (this.camu === 2) {
        if (this.timeDiff(this.camuTime) > 15000) {
            this.camu = 3;
            this.camuFade = 0;
            this.clients();
        }
    
    // Fade in
    } else if (this.camu === 3) {
        if (this.camuFade <= 100) {
            this.camuFade += 5;
            this.update();
        
        } else {
            this.camuFade = -1;
            this.camu = 0;
        }
    }
    
    if (this.mr !== this.oldMr) {
        this.update();
        this.oldMr = this.mr;
    }
};

ActorPlayer.limitSpeed = function() {
    var maxSpeed = this.boost ? 4.5 : 3;
    var r = Math.atan2(this.mx, this.my);
    
    var speed = Math.sqrt(Math.pow(this.x - (this.x + this.mx), 2)
                        + Math.pow(this.y - (this.y + this.my), 2));
    
    if (speed > maxSpeed) {
        speed = maxSpeed;
    }
    this.mx = Math.sin(r) * speed;
    this.my = Math.cos(r) * speed;
    this.speed = speed;
}

ActorPlayer.enableArmor = function() {
    this.armorHP = 16;
    this.armor = true;
    this.armorDis = false;
    this.armorTime = this.getTime();
    this.polygon = new Polygon2D(this.x, this.y, this.r, ActorPlayer.shapeArmor);
};

ActorPlayer.disableArmor = function() {
    this.polygon = new Polygon2D(this.x, this.y, this.r, ActorPlayer.shape);
    this.armor = false;
    this.armorDis = false;
    this.armorHP = 0;
};

ActorPlayer.damage = function(dmg) {
    this.hp -= dmg;
    this.damageTaken += dmg;
    if (this.damageTaken >= 40 && this.hp > 0) {
        this.$$.achievement(this, 'stamina');
        this.damageTaken -= 40;
    }
    
    if (this.bulletsTaken >= 5 && this.hp > 0) {
        this.$$.achievement(this, 'bullets');
        this.bulletsTaken -= 5;
    }
};

ActorPlayer.checkPowerUps = function() {
    if ((this.shield || this.armor) && this.missiles >= 5 && this.defender) {
        if (!this.master) {
            this.$$.achievement(this, 'master');
            this.master = true;
        }
    }
};

ActorPlayer.stopArmor = function() {
    this.armorTime = this.getTime();
    this.armorDis = true;
};

ActorPlayer.onDestroy = function() {
    this.clients();
    if (this.defender !== null) {
        this.defender.destroy();
    }
    this.defender = null;
    this.hp = 0;
    
    if (!this.client.left && this.timeDiff(this.badTime) <= 2200) {
        this.$$.achievement(this, 'bad');
    }
};

ActorPlayer.onMessage = function(once) {
    var msg = [
        Math.round(this.r * 10) / 10,
        this.interleave(this.mr),
        (this.defense % 200) !== 0,
        this.thrust,
        this.boost,
        this.shield,
        this.camuFade,
        this.missiles,
        this.armor
    ];
    
    if (once) {
        msg.push(this.cid);
    }
    return msg;
};


// Missile ---------------------------------------------------------------------
var ActorMissile = Shooter.Actor('missile', 2);
ActorMissile.onCreate = function(data) {
    this.time = this.getTime();
    this.player = data.player;
    this.player.client.shots++;
    
    this.r = data.r;
    this.speed = this.$$.launchAt(this, 4, this.r, 4, 7);
    this.x = this.player.x + Math.sin(this.$$.wrapAngle(this.r)) * data.d;
    this.y = this.player.y + Math.cos(this.$$.wrapAngle(this.r)) * data.d;
    
    this.time = this.getTime();
    this.tick = this.getTime() - 500;
    this.target = null;
};
        
ActorMissile.onUpdate = function() {
    if (this.speed > 5) {
        this.speed /= 1.05;
        if (this.speed < 5) {
            this.speed = 5;
        }  
    }
    if (this.speed < 5) {
        this.speed *= 1.05;
        if (this.speed > 5) {
            this.speed = 5;
        }  
    }
    
    // Find target
    if (this.timeDiff(this.tick) > 75) {
        var players = this.$.getActors('player');
        var max = 10000;
        var target = this.target;
        this.target = null;
        
        var defTarget = null;
        for(var i = 0, l = players.length; i < l; i++) {
            var p = players[i];
            var dist = this.$$.getDistance(this, p);
            if (dist < 100 && dist < max
                && (p !== this.player
                    || (this.timeDiff(this.time) > 2150 && !target))
                
                && p.camu !== 2) {
                
                if (p.defense === 0) {
                    this.target = p;
                
                } else {
                    defTarget = p;
                }
            }
        }
        
        if (this.target === null) {
            this.target = defTarget;
        }
        this.tick = this.getTime();
    }
    
    // Steer
    if (this.target && this.target.alive()) {
        var dr = this.$$.getAngle(this, this.target);
        dr = this.$$.wrapAngle(this.r - dr);
        if (dr < 0) {
            this.r -= Math.max(dr / 15, -0.3);
        
        } else {
            this.r -= Math.min(dr / 15, 0.3);
        }
        this.r = this.$$.wrapAngle(this.r);
    }
    
    this.mx = Math.sin(this.r) * this.speed;
    this.my = Math.cos(this.r) * this.speed;
    this.x += this.mx;
    this.y += this.my;
    
    // Wrap
    this.$$.wrapPosition(this);
    
    // Destroy
    if (this.timeDiff(this.time) > 5000) {
        this.player.client.achieveMissile++;
        this.destroy();
    }
};

ActorMissile.onMessage = function(once) {
    return once ? [this.player.cid, this.r] : [this.r];
};


// Bullet ----------------------------------------------------------------------
var ActorBullet = Shooter.Actor('bullet', 6);
ActorBullet.onCreate = function(data) {
    this.time = this.getTime();
    this.player = data.player;
    this.player.client.shots++;
    
    this.r = data.r;
    this.$$.launchAt(this, 4, this.r, 4, 7);    
    this.x = this.player.x + Math.sin(this.$$.wrapAngle(this.r)) * data.d;
    this.y = this.player.y + Math.cos(this.$$.wrapAngle(this.r)) * data.d;
    this.time = this.getTime();
};
        
ActorBullet.onUpdate = function() {
    this.x += this.mx;
    this.y += this.my;
    this.$$.wrapPosition(this);
    if (this.timeDiff(this.time) > 3000) {
        this.destroy();
    }
};

ActorBullet.onMessage = function(once) {
    return once ? [this.player.cid]: [];
};


// Bomb ------------------------------------------------------------------------
var ActorBomb = Shooter.Actor('bomb', 6);
ActorBomb.onCreate = function(data) {
    this.time = this.getTime();
    this.range = 120;
    this.fired = false;
    this.r = data.r;
    
    this.player = data.player;
    this.killedPlayers = [];
    
    if (this.player) {
        this.cid = this.player.cid;
        this.player.client.shots++;
        this.$$.launchAt(this, 4, this.r, 6, 9);
        this.x = this.player.x + Math.sin(this.$$.wrapAngle(this.r)) * data.d;
        this.y = this.player.y + Math.cos(this.$$.wrapAngle(this.r)) * data.d;
    
    } else {
        this.cid = 0;
        this.x = data.obj.x;
        this.y = data.obj.y;
    }
};

ActorBomb.onUpdate = function() {
    this.x += this.mx;
    this.y += this.my;
    this.$$.wrapPosition(this);
    if (this.timeDiff(this.time) > 4000) {
        this.destroy();
    }
};

ActorBomb.finishExplosion = function() {
    if (this.killedPlayers.length === 1 && this.fired) {
        if (this.killedPlayers[0] === this.cid) {
            this.$$.achievement(this.player, 'awesome');
        }
    
    } else if (this.killedPlayers.length === 0 && this.fired) {
        this.$$.achievement(this.player, 'fire');
    }
    
    var players = this.$$.getActors('player');
    for(var i = 0, l = players.length; i < l; i++) {
        var e = players[i];
        if (e !== this.player && e.defense === 0
            && this.$$.bombBorderCollision(this, e, this.$$.sizePlayer)) {
            
            this.$$.achievement(e, 'close');
        }
    }
};

ActorBomb.checkPlayerCollision = function(p) {
    if (this.timeDiff(this.time) > 3750
        && p.cid !== this.cid) {
        
        this.$$.achievement(this.player, 'sharp');
    }   
};

ActorBomb.onDestroy = function() {
    this.$$.destroyBomb(this);
};

ActorBomb.onMessage = function(once) {
    return once ? [this.cid, this.range] : [];
};


// PowerUp ---------------------------------------------------------------------
var ActorPowerUp = Shooter.Actor('powerup', 0);
ActorPowerUp.onCreate = function(data) {
    this.$$.randomPosition(this, this.$$.sizePowerUp);
    this.type = data.type;
    this.time = this.getTime() + 15000 + Math.ceil(Math.random() * 5000);
    this.timed = false;
};

ActorPowerUp.collect = function() {
    this.timed = true;
    this.destroy();
};

ActorPowerUp.onUpdate = function() {
    if (this.getTime() > this.time) {
        this.$$.removePowerUp(this.type);
        this.timed = true;
        this.destroy();
    }
};

ActorPowerUp.onDestroy = function() {
    if (!this.timed && this.type === 'bomb') {
        var bomb = this.$.createActor('bomb', {
            'r': 0,
            'obj': this,
            'd': 0
        });
        bomb.destroy();
    }
};

ActorPowerUp.onMessage = function(once) {
    return once ? [this.type] : [];
};


// Player Defender -------------------------------------------------------------
var ActorPlayerDef = Shooter.Actor('player_def', 6);
ActorPlayerDef.onCreate = function(data) {
    this.player = data.player;
    this.player.defender = this;
    this.level = 1;
    this.r = (Math.random() * (Math.PI * 2)) - Math.PI;
    this.mr = 0.20;
    this.shotTime = this.getTime();
    this.initTime = this.getTime();
    
    this.x = this.player.x + Math.sin(this.r) * 35;
    this.y = this.player.y + Math.cos(this.r) * 35;
    this.$$.wrapPosition(this);
    
    this.mx = this.player.mx;
    this.my = this.player.my;
    this.mxOld = this.mx;
    this.myOld = this.my;
};

ActorPlayerDef.onUpdate = function() {
    this.x = this.player.x + Math.sin(this.r) * 35;
    this.y = this.player.y + Math.cos(this.r) * 35;
    this.$$.wrapPosition(this);
    
    this.mx = this.player.mx;
    this.my = this.player.my;
    
    if (this.timeDiff(this.initTime) < 14000) {
        if (this.timeDiff(this.initTime) > 7500) {
            this.level = 2;
        }
        
        if (this.timeDiff(this.shotTime) > (this.level === 1 ? 1200 : 180)) {
            this.$.createActor('bullet', {
                'player': this.player,
                'r': this.r,
                'd': 35
            });
            this.shotTime = this.getTime();
        }
    }
    this.r = this.$$.wrapAngle(this.r + this.mr);
    if (this.mx !== this.mxOld || this.my !== this.myOld) {
        this.mxOld = this.mx;
        this.myOld = this.my;
        this.update();
    }
};

ActorPlayerDef.onDestroy = function() {
    this.player.defender = null;
};

ActorPlayerDef.onMessage = function(once) {
    return once ? [this.player.cid, this.r, this.interleave(this.mr),
                   Math.round(this.player.x * 100) / 100,
                   Math.round(this.player.y * 100) / 100]
                   : [this.r, Math.round(this.player.x * 100) / 100,
                              Math.round(this.player.y * 100) / 100];
};


// Asteroid --------------------------------------------------------------------
var ActorAsteroid = Shooter.Actor('asteroid', 6);
ActorAsteroid.shapes = [
    new Shape2D([[-1, -6], [-7, -4], [-6, 4], [2, 5], [6, -2]], 2.4),
    new Shape2D([[-2, -13], [-13 , -8], [-12, 8], [-2, 12], [11, 10], [12, -8]],
                  2.4),
    
    new Shape2D([[-5, -16], [-16 , -9], [-15, 12], [-4, 16], [13, 13], [16, -5],
                 [10, -15]], 2.4),
    
    new Shape2D([[-66, -120], [-126, -56], [-92, 76], [-42, 118], [6, 102],
                 [120, 62], [148, 36], [148, -22], [58, -90]], 5),
    
    new Shape2D([[-96, -100], [-126, -26], [-112, 75], [-32, 92], [35, 92],
                 [110, 70], [138, 36], [128, -52], [28, -120]], 5)
];

ActorAsteroid.onCreate = function(data) {    
    this.type = data.type;
    this.hp = [1, 5, 10, 20, 150, 150][this.type];
    this.broken = null;
    this.destroyer = data.destroyer || null;
    var size = this.$$.sizeAsteroid * 2;
    
    var tx = this.$$.width / 4 + (Math.random() * (this.$$.width / 2));
    var ty = this.$$.height / 4 + (Math.random() * (this.$$.height / 2));
    if (this.type >= 4) {
        tx = this.$$.width / 3 + (Math.random() * (this.$$.width / 3));
        ty = this.$$.height / 3 + (Math.random() * (this.$$.height / 3));
        size = this.$$.sizeBigAsteroid * 1.1;
    }
    
    this.$$.randomPositionAsteroid(this, size);
    this.polygon = new Polygon2D(this.x, this.y, this.r,
                                 ActorAsteroid.shapes[this.type - 1]);
    
    var speed = Math.random() * 2.0 + 0.75;
    this.r = this.$$.wrapAngle(Math.atan2(tx - this.x, ty - this.y));
    this.mr = ((Math.random() * Math.PI * 2) - Math.PI) / 20; 
    if (this.mr > -0.02 && this.mr < 0.02) {
        this.mr *= 2;
        
    } else if (this.mr < -0.10 || this.mr > 0.10) {
        this.mr *= 0.5;
    }
    
    if (this.type >= 4) {
        speed = Math.random() * 1.20 + 1.40;
        this.x += this.x < this.$$.halfWidth ? -128 : 128;
        this.y += this.y < this.$$.halfHeight ? -128 : 128;
        this.r = this.$$.wrapAngle(Math.atan2(tx - this.x, ty - this.y));
        this.mr *= 0.125;
    }
    while (this.mr > -0.01 && this.mr < 0.01) {
        this.mr *= 2.5;
    }
    
    this.mr = Math.round(this.mr * 100) / 100;
    this.mx = Math.sin(this.r) * speed;
    this.my = Math.cos(this.r) * speed;
};

ActorAsteroid.setMovement = function(x, y, dist, r, player, bigSpeed) {
    this.r = this.$$.wrapAngle(r);
    this.x = x + Math.sin(r) * dist;
    this.y = y + Math.cos(r) * dist;
    
    var speed = Math.random() * 2.0 + 0.75;
    if (player) {
        speed = 0.75 + Math.sqrt(player.mx * player.mx
                                + player.my * player.my) * 0.65;
    }
    
    if (bigSpeed !== undefined) {
        speed = bigSpeed;
    }
    
    this.mx = Math.sin(this.r) * speed;
    this.my = Math.cos(this.r) * speed;
    this.polygon.transform(this.x, this.y, this.r);
};

ActorAsteroid.onUpdate = function() {
    this.r = this.$$.wrapAngle(this.r + this.mr);
    this.x += this.mx;
    this.y += this.my;
    this.polygon.transform(this.x, this.y, this.r);
    
    if (this.type < 4) {
        this.$$.wrapPosition(this);
    
    } else if (this.x < -160 || this.y < -160
               || this.x > this.$$.width + 160
               || this.y > this.$$.height + 160) {
        
        this.remove();
    }
};

ActorAsteroid.onDestroy = function() {
    this.hp = 0;
    if (this.type < 4 || this.$$.roundFinished) {
        return;
    }
    
    var asteroids = [];
    var bounds = this.polygon.bounds();
    var xs = this.$$.sizeAsteroid * 2;
    var ys = this.$$.sizeAsteroid * 2;
    for(var y = bounds[1]; y < bounds[3] + ys; y += ys) {
        for(var x = bounds[0]; x < bounds[2] + xs; x += xs) {
            if (x < -16 || x > this.$$.width + 16 || y < -16
                || y > this.$$.height + 16) {
                
                continue;
            }
            
            if (!this.polygon.containsCircle(x, y, this.$$.sizeAsteroid)) {
                continue;
            }
            
            var a = this.$$.createActor('asteroid', {
                                        'type': 2 + Math.round(Math.random(1)),
                                        'destroyer': this.destroyer});
            
            var dx = x - this.x;
            var dy = y - this.y;
            var dist = Math.sqrt(dx * dx + dy * dy); 
            var speed = (Math.random() * 1.0 + 1.75) * 4.5;
            var distPercent = 100 / this.polygon.radius * (this.polygon.radius - dist);
            
            var r = this.$$.wrapAngle(Math.atan2(dx, dy));
            a.setMovement(x, y, 0, r, null, 0.5 + speed / (1.0 + distPercent / 20));   
            asteroids.push(a);
        }
    }
    
    xs = this.$$.sizeAsteroid;
    ys = this.$$.sizeAsteroid;
    for(var y = bounds[1]; y < bounds[3] + ys; y += ys) {
        for(var x = bounds[0]; x < bounds[2] + xs; x += xs) {
            if (x < -16 || x > this.$$.width + 16 || y < -16
                || y > this.$$.height + 16) {
                
                continue;
            }
             
            if (!this.polygon.containsCircle(x, y, this.$$.sizeAsteroid / 2.5)) {
                continue;
            }
            
            var dx = x - this.x, dy = y - this.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.polygon.radius / 2) {
                continue;
            }
            
            var place = true;
            for(var i = 0, l = asteroids.length; i < l; i++) {
                if (asteroids[i].polygon.intersectsCircle(x, y, this.$$.sizeAsteroid / 2.5)) {
                    place = false;
                    break;
                }
            }
            
            if (!place) {
                continue;
            }
            
            var a = this.$$.createActor('asteroid', {
                                        'type': 1,
                                        'destroyer': this.destroyer});
            
            var r = this.$$.wrapAngle(Math.atan2(dx, dy));
            var speed = (Math.random() * 1.0 + 1.75) * 4.5;
            var distPercent = 100 / this.polygon.radius * (this.polygon.radius - dist);
            a.setMovement(x, y, 0, r, null, 0.5 + speed / (1.0 + distPercent / 20));
        }
    }
};

ActorAsteroid.onMessage = function(once) {
    return once ? [this.r, this.interleave(this.mr), this.type] : [this.r];
};

