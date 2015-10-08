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


// Game ------------------------------------------------------------------------
// -----------------------------------------------------------------------------
var Shooter = NodeGame(30);

Shooter.colorCodes = ['#f00000', '#0080ff', '#f0f000', '#00f000', '#9000ff','#3F5D7D','#279B61','#008AB8','#A3E496','#FFCC33'];
Shooter.colorCodesFaded = ['#700000', '#004080', '#707000', '#007000', '#500080'];
Shooter.powerUpColors = {
    'shield':  '#0060c0', // blue
    'armor':   '#00c9ff', // teal
    'missile': '#d00000', // red
    'life':    '#00b000', // green
    'boost':   '#f0c000', // yellow
    'defense': '#9c008c', // purple
    'bomb':    '#d0d0d0', // light gray
    'camu':    '#808080'  // camu
};

Shooter.reset = function() {
    this.particles = [];
    this.canvas = $('bg');
    
    this.roundTime = 0;
    this.roundStart = 0;
    this.roundID = 0;
    this.roundStats = {};
    this.roundGO = null;
    this.playing = false;
    this.kicked = false;
    this.player = null;
    this.playerNames = {};
    this.playerScores = {};
    this.playerColors = {};
    
    this.infoLeftText = '';
    this.infoRightText = '';
    this.tutorialFadeOut();
    this.achievementHide();
};


// Checks ----------------------------------------------------------------------
Shooter.checkServer = function(host, port) {
    var that = this;
    var conn = new WebSocket('ws://' + host + ':' + port);
    var online = false;
    conn.onopen = function() {
        online = true;
        conn.close();
        that.onServerStatus(true);
    };
    
    conn.onclose = function() {
        if (!online) {
            that.onServerStatus(false);
        }
        that.checkTimer = window.setTimeout(function() {
                                                that.checkServer(host, port);
                                            }, 10000);
    };
};

Shooter.checkRound = function(data) {
    if (this.roundGO !== !!data.rg) {
        if (data.ri !== undefined) {
            this.roundID = data.ri;
        }
        this.roundStats = data.rs;
        this.roundStart = this.getTime();
        this.roundTime = data.rt; 
    }
    this.roundGO = !!data.rg;
};

Shooter.checkPlayers = function(data) {
    var count = 0;
    for(var i in data.p) {
        count++;
    }
    
    var login = $('loginOverlay');
    if (!this.playing) {
        if (count < this.maxPlayers) {
            if (login.style.display !== 'block' && !this.watching) {
                show(login);
                $('login').focus();
            }
        
        } else {
            hide(login);
        }
    }
};


// Tutorial --------------------------------------------------------------------
Shooter.tutorials = {
    'start': ['Bắn loạn xí ngầu !\n WASD để di chuyển.', 'asteroids'],
    'asteroids': ['tránh gấp đê !\n', 'shoot'],
    'shoot': ['Bấm SPACE để bắn.\n!', 'powerups'],
    'powerups': ['Thu thập các ngọc màu ?\n để sử dụng các vật dụng siêu nhiên ', 'powerups1'],
    'powerups1': ['...<span style="color: #0060c0">Lá chắn</span>, '
                  + '<span style="color: #00c9ff">Giáp</span>, '
                  + '<span style="color: #d00000">Tên lửa</span> và '
                  + '<span style="color: #00b000">Máu</span>.\n'
                  + 'Còn nhiều hơn nữa <span style="color: #f0c000">Tốc độ</span>, '
                  + '<span style="color: #808080">Tàng hình</span> và '
                  + '<span style="color: #9c008c">Phòng thủ</span>.',
                   'bomb'],
        
    'bomb': [' <span style="color: #d0d0d0">BOMB</span>.\n'
                  + 'Bấm RETURN hoặc M thả bomb :3 .', 'finish'],
    
    'finish': ['Hướng dẫn vậy ko biết nữa thì thôi', 'done']
};


Shooter.tutorial = function(id) {
    var that = this;
    if (this.tutorialEnabled && id in Shooter.tutorials) {
        show('tutorial');
        show('tutorialOverlay');
        $('tutorial').innerHTML = Shooter.tutorials[id][0].replace(/\n/g, '<br/>');
        this.tutorialFadeIn();
        
        this.tutorialNext = this.tutorials[id][1];
        this.tutorialTimers[0] = window.setTimeout(function() {
                                                        that.tutorialFadeOut();
                                                   }, 7500); 
        
        var showNext = function() {
            if (that.tutorialEnabled) {
                if (that.roundGO) {
                    that.tutorial(that.tutorialNext);
                
                } else {
                    that.tutorialTimers[1] = window.setTimeout(showNext, 500); 
                }
            }
        };
        this.tutorialTimers[1] = window.setTimeout(showNext, 8500); 
    
    } else if (id === 'done') {
        this.onTutorial(false);
        hide('tutorial');
        hide('tutorialOverlay');
    }
};


// Utility ---------------------------------------------------------------------
function initGame() {
    Shooter.connect(HOST, PORT);
}

function show(id) {
    $(id).style.display = 'block';
}

function hide(id) {
    $(id).style.display = 'none';
}

function $(id) {
    return typeof id === 'string' ? document.getElementById(id) : id;
}

