
function CollisionSide(){
	this.none= -1;
	this.right= 0;
	this.up= 1;
	this.left= 2;
	this.down= 3;
}
var collisionSide= new CollisionSide();

function CollisionResult(touch_pos, col_side){
	this.side= col_side;
	this.touchingPos= touch_pos;
}

/// Returns CollisionResult which tells collision info for the first rect
function rectRectCollision(pos1, rad1, pos2, rad2){
	var dif= [pos2[0] - pos1[0], pos2[1] - pos1[1]];
	var dist= [Math.abs(dif[0]), Math.abs(dif[1])];
	var mindist= [rad1[0] + rad2[0], rad1[1] + rad2[1]];
	
	if (dist[0] <= mindist[0] && dist[1] <= mindist[1]){
		var rel_k= (dist[1]/mindist[1]) / (dist[0]/mindist[0]);
		var epsilon= 0.001; // Keep free_pos a bit intersecting so that collision is continuous
		
		if (rel_k > 1.05){ // 0.95 to allow sliding on walls
			if (pos1[1] < pos2[1]){
				var free_pos= [pos1[0], pos2[1] - mindist[1] + epsilon];
				return new CollisionResult(free_pos, collisionSide.up);
			}
			else {
				var free_pos= [pos1[0], pos2[1] + mindist[1] - epsilon];
				return new CollisionResult(free_pos, collisionSide.down);
			}
		}
		else {
			if (pos1[0] < pos2[0]){
				var free_pos= [pos2[0] - mindist[0] + epsilon, pos1[1]];
				return new CollisionResult(free_pos, collisionSide.right);
			}
			else {
				var free_pos= [pos2[0] + mindist[0] - epsilon, pos1[1]];
				return new CollisionResult(free_pos, collisionSide.left);
			}
		}
	}

	return new CollisionResult(pos1, collisionSide.none);
}