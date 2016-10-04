//------------------------------------------------------------------
// Components
//------------------------------------------------------------------
function Transform() {
	this.prevPosition = new Vec2();
	this.position = new Vec2();
	this.scale = new Vec2(1, 1);
	this.rotation = 0;
	this.parent = null;
}

Transform.prototype.getAbsolutePosition = function() {
	var at = this.parent;
	var p = this.position;

	while (at != null) {
		p = p.rotate(at.rotation).add(at.position);
		at = at.parent;
	}

	return p;
}

Transform.prototype.getAbsoluteRotation = function() {
	var at = this.parent;
	var r = this.rotation;

	while (at != null) {
		r = r + at.rotation;
		at = at.parent;
	}

	return r;
}

function Player() {
	this.round = 0;
}

function CPU() {
}

function Fighter(name) {
	this.name = name;
	this.hp = 100;

	this.timeToActivate = 2;
	
	this.comboIndex = 0;
	this.comboSequence = ["attack01", "attack02", "attack03", "fatality"];
	this.comboDamage = {"attack01":8, "attack02":11, "attack03":15, "fatality":0};
	this.comboHit = {"attack01":3, "attack02":1, "attack03":1, "fatality":2};
	this.comboHitPos = {"attack01":[165, -95], "attack02":[155, -135], "attack03":[165, -160], "fatality":[50, 50]};

	this.delayTime = 0;
	this.attack = false;
	this.defend = false;
	this.getHit = false;
	this.dizzy = false;

	this.attackEmitted = false;

	this.opponentId;
}

function View(sprite, container) {
	this.sprite = sprite;
	this.node = new createjs.Container();
	this.node.addChild(sprite);
	container.addChildAt(this.node, 0);
}