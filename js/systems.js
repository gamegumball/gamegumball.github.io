//------------------------------------------------------------------
// Systems
//------------------------------------------------------------------
function PlayerSystem() {
}

PlayerSystem.prototype = new System();

PlayerSystem.prototype.update = function (dt) {
	var playerList = this.ces.getListOfComponent(Player);
	var cpuList = this.ces.getListOfComponent(CPU);
	var fighterList = this.ces.getListOfComponent(Fighter);
	var viewList = this.ces.getListOfComponent(View);

	for (var playerId in playerList) {
		var player = playerList[playerId];
		var fighter = fighterList[playerId];

		if (!fighter.opponentId) {
			for (var cpuId in cpuList) {
				fighter.opponentId = cpuId;
			}
		}	
		
		fighter.timeToActivate -= dt;
		if (fighter.timeToActivate > 0 || fighter.dizzy)
			continue;
		
		if (input.attack) {
			fighter.attack = true;
		}

		if (input.defend) {
			fighter.defend = true;	
		}
	}

	input.attack = false;
	input.defend = false;
}

function CPUSystem() {
	this.updateTime = 0.2;
	this.currentTime = 0;
}

CPUSystem.prototype = new System();

CPUSystem.prototype.update = function (dt) {
	this.currentTime += dt;

	var random = Math.random();

	var cpuList = this.ces.getListOfComponent(CPU);
	var playerList = this.ces.getListOfComponent(Player);
	var fighterList = this.ces.getListOfComponent(Fighter);
	var viewList = this.ces.getListOfComponent(View);

	for (var cpuId in cpuList) {
		var cpu = cpuList[cpuId];
		var fighter = fighterList[cpuId];

		if (!fighter.opponentId) {
			for (var playerId in playerList) {
				fighter.opponentId = playerId;
			}
		}

		fighter.timeToActivate -= dt;
		if (fighter.timeToActivate > 0 || fighter.dizzy)
			continue;

		if (this.currentTime < this.updateTime) 
			continue;
		
		this.currentTime = 0;

		var opponentView = viewList[fighter.opponentId];

		var iaLvl = fight * 5;

		if (opponentView.sprite.currentAnimation == "attack01") {
			if (random > 0.75 - (iaLvl / 100)) {
				fighter.defend = true;
			}
		} else {
			if (random > 0.75) {
				fighter.defend = true;
			}
		}

		if (!fighter.defend 
			&& (opponentView.sprite.currentAnimation == "hit" 
				|| opponentView.sprite.currentAnimation == "rebounce")) {
			if (random > 0.85 - (iaLvl / 100)) {
				fighter.attack = true;
			} 
		} else {
			if (random > 0.85) {
				fighter.attack = true;
			} 
		}
	}
}

function Combat() {
}

Combat.prototype = new System();

Combat.prototype.update = function (dt) {
	var fighterList = this.ces.getListOfComponent(Fighter);
	var viewList = this.ces.getListOfComponent(View);
	var transformList = this.ces.getListOfComponent(Transform);

	for (var fighterId in fighterList) {
		var fighter = fighterList[fighterId];
		var view = viewList[fighterId];
		var transform = transformList[fighterId];
		var opponent = fighterList[fighter.opponentId];
		var opponentView = viewList[fighter.opponentId];

		if (fighter.attack) {
			if (view.sprite.currentAnimation == "idle") {
				if (opponentView.sprite.currentAnimation == "hit") {
					fighter.comboIndex = (fighter.comboIndex + 1) % 3;
				} else {
					fighter.comboIndex = 0;
				} 

				if (opponent.dizzy)
					fighter.comboIndex = 3;

				var hitAnimation = fighter.comboSequence[fighter.comboIndex];

				fighter.attackEmitted = false;
				view.sprite.gotoAndPlay(hitAnimation);
			} 
		} else if (fighter.defend) {
			if (view.sprite.currentAnimation == "idle") {
				view.sprite.gotoAndPlay("defense");
			}
		}

		fighter.attack = false;
		fighter.defend = false;
	}
}

function HitEmitter() {
}

HitEmitter.prototype = new System();

HitEmitter.prototype.update = function (dt) {
	var fighterList = this.ces.getListOfComponent(Fighter);
	var viewList = this.ces.getListOfComponent(View);
	var transformList = this.ces.getListOfComponent(Transform);

	for (var fighterId in fighterList) {
		var fighter = fighterList[fighterId];
		var view = viewList[fighterId];
		var transform = transformList[fighterId];
		var opponent = fighterList[fighter.opponentId];

		if (view.sprite.currentAnimation.indexOf("attack0") != -1 || view.sprite.currentAnimation == "fatality") {
			if (fighter.comboHit[view.sprite.currentAnimation] == Math.floor(view.sprite.currentAnimationFrame) && !fighter.attackEmitted) {
				fighter.attackEmitted = true;
				opponent.getHit = true;
			}
		}
	}
}

function HitResult(onHitHandler) {
	this.onHitHandler = onHitHandler;
}

HitResult.prototype = new System();

HitResult.prototype.update = function (dt) {
	var fighterList = this.ces.getListOfComponent(Fighter);
	var viewList = this.ces.getListOfComponent(View);
	var transformList = this.ces.getListOfComponent(Transform);

	for (var fighterId in fighterList) {
		var fighter = fighterList[fighterId];
		var view = viewList[fighterId];
		var transform = transformList[fighterId];

		var opponent = fighterList[fighter.opponentId];
		var opponentView = viewList[fighter.opponentId];
		var opponentTransform = transformList[fighter.opponentId];

		if (fighter.getHit) {
			view.node.parent.setChildIndex(view.node, 0);
			stage.update();

			if (view.sprite.currentAnimation == "dizzy" || view.sprite.currentAnimation == "death") {
				view.sprite.gotoAndPlay("death");
				playSound("splat");
			} else if (view.sprite.currentAnimation != "defense") {
				playSound("punchkick");

				if (Math.random() > 0.5) {
					if (fighter.name == "player1") {
						playSound("hitpc2");
					} else {
						playSound("hitpc1");
					}
				}

				var displacement = (opponentTransform.position.x - transform.position.x) / 20;

				fighter.hp -= opponent.comboDamage[opponent.comboSequence[opponent.comboIndex]];

				view.sprite.gotoAndPlay("hit");

				createjs.Tween.get(transform.position, true)
					.to({x:transform.position.x - displacement}, 150, createjs.Ease.sineOut);

				createjs.Tween.get(opponentTransform.position, true)
					.to({x:opponentTransform.position.x - displacement}, 150, createjs.Ease.sineIn);
			} else {
				playSound("deadhit");

				fighter.hp -= opponent.comboDamage[opponent.comboSequence[opponent.comboIndex]] / 2;

				view.sprite.gotoAndPlay("defenseIdle");
				opponentView.sprite.gotoAndPlay("rebound");
			}

			if (!fighter.dizzy)
				this.onHitHandler(fighter);

			if (fighter.hp <= 0 && !fighter.dizzy) {
				view.sprite.gotoAndPlay("dizzy");
				fighter.dizzy = true;
				opponent.timeToActivate = 2;
			}
		}

		fighter.getHit = false;
	}
}

function FighterGetDizzy(handler) {
	this.handler = handler;
	this.emitted = false;
}

FighterGetDizzy.prototype = new System();

FighterGetDizzy.prototype.update = function (dt) {
	var playerList = this.ces.getListOfComponent(Player);
	var fighterList = this.ces.getListOfComponent(Fighter);

	for (var fighterId in fighterList) {
		var fighter = fighterList[fighterId];

		if (!this.emitted) {
			if (fighter.hp <= 0) {
				this.handler(fighter);
				this.emitted = true;
			}
		}
	}
}

function GameOver(handler) {
	this.handler = handler;
	this.emitted = false;
}

GameOver.prototype = new System();

GameOver.prototype.update = function (dt) {
	var viewList = this.ces.getListOfComponent(View);
	var fighterList = this.ces.getListOfComponent(Fighter);

	for (var fighterId in fighterList) {
		var fighter = fighterList[fighterId];
		var opponent = fighterList[fighter.opponentId]
		var opponentView = viewList[fighter.opponentId];

		if (!this.emitted) {
			if (fighter.hp <= 0 && 
				opponentView.sprite.currentAnimation == "fatality" && 
				Math.floor(opponentView.sprite.currentAnimationFrame) == opponentView.sprite.spriteSheet.getNumFrames("fatality") - 1) {
				this.handler(fighter);
				this.emitted = true;
				fighter.timeToActivate = 9999;
				opponent.timeToActivate = 9999;
			}
		}
	}
}

function RenderSystem() {
}

RenderSystem.prototype = new System();

RenderSystem.prototype.update = function (dt) {
	var viewList = this.ces.getListOfComponent(View);
	var transformList = this.ces.getListOfComponent(Transform);

	for (var entityId in viewList) {
		if (transformList[entityId]) {
			var view = viewList[entityId];
			var transform = transformList[entityId];
			var absolutePosition = transform.getAbsolutePosition();

			view.node.x = Math.floor(absolutePosition.x);
			view.node.y = Math.floor(absolutePosition.y);
			view.node.rotation = transform.getAbsoluteRotation() * 180 / Math.PI;
		}
	}
}