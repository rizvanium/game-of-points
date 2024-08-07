package io.rizvan.beans.actors;

import io.rizvan.beans.HitBox;
import io.rizvan.beans.Weapon;
import jakarta.json.bind.annotation.JsonbTransient;

public class CompetingEntity extends GameEntity {
    private Weapon weapon;
    private int hitPoints;
    private double speed;
    private int points;

    private double mouseX;
    private double mouseY;

    public static final double BASE_SPEED = 0.4;

    public CompetingEntity() {}

    public CompetingEntity(int hitPoints, double x, double y, int width, int height, double speed, int points, Weapon weapon) {
        super(x, y, width, height);
        this.weapon = weapon;
        this.hitPoints = hitPoints;
        this.speed = speed * BASE_SPEED;
        this.points = points;
        this.mouseX = 0.0;
        this.mouseY = 0.0;
    }

    public CompetingEntity(CompetingEntity other) {
        super(other);
        this.weapon = new Weapon(other.weapon);
        this.hitPoints = other.hitPoints;
        this.speed = other.speed;
        this.points = other.points;
        this.mouseX = other.mouseX;
        this.mouseY = other.mouseY;
    }

    public double getReach() {
        return weapon.getRange();
    }

    public double getSpeed() {
        return speed * weapon.getSpeedModifier();
    }

    public int getDamage() {
        return weapon.getDamage();
    }

    public int getAmmo() {
        return weapon.getAmmo();
    }

    public int getHitPoints() {
        return hitPoints;
    }

    public void setHitPoints(int hitPoints) {
        this.hitPoints = Math.max(hitPoints, 0);
    }

    public void setSpeed(double speed) {
        this.speed = speed;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public void addPoints(int points) {
        this.points += points;
    }

    public double getMouseX() {
        return mouseX;
    }

    public void setMouseX(double mouseX) {
        this.mouseX = mouseX;
    }

    public double getMouseY() {
        return mouseY;
    }

    public void setMouseY(double mouseY) {
        this.mouseY = mouseY;
    }

    public Weapon getWeapon() {
        return weapon;
    }

    public void setWeapon(Weapon weapon) {
        this.weapon = weapon;
    }

    public int shoot() {
        return weapon.shoot();
    }

    @JsonbTransient
    public boolean isRecharging() {
        return weapon.isRecharging();
    }

    public boolean isAlive() {
        return hitPoints > 0;
    }

    public boolean canReach(GameEntity other) {
        return canReach(other.getX(), other.getY(), other.getHitBox());
    }

    public boolean canReach(double x, double y, HitBox hitBox) {
        double circleCenterX = this.getX();
        double circleCenterY = this.getY();
        double circleRadius = this.getReach();

        return touchesReachCircle(circleCenterX, circleCenterY, circleRadius, x, y, hitBox);
    }

    public boolean collidesWith(GameEntity other) {
        int halfWidth = hitBox.getWidth() / 2;
        int halfHeight = hitBox.getHeight() / 2;
        int otherHalfWidth = other.getHitBox().getWidth() / 2;
        int otherHalfHeight = other.getHitBox().getHeight() / 2;

        double thisLeft = this.x - (double) halfWidth;
        double thisRight = this.x + (double) halfWidth;
        double thisTop = this.y - (double) halfHeight;
        double thisBottom = this.y + (double) halfHeight;

        double otherLeft = other.x - (double) otherHalfWidth;
        double otherRight = other.x + (double) otherHalfWidth;
        double otherTop = other.y - (double) otherHalfHeight;
        double otherBottom = other.y + (double) otherHalfHeight;

        // Check if there is any overlap between the two rectangles
        return !(thisRight < otherLeft) && !(thisLeft > otherRight) &&
                !(thisBottom < otherTop) && !(thisTop > otherBottom);
    }

    public static boolean touchesReachCircle(double circleX, double circleY, double circleRadius, double x, double y, HitBox hitBox) {
        double halfWidth = hitBox.getWidth() / 2.0;
        double halfHeight = hitBox.getHeight() / 2.0;

        double corner1X = x - halfWidth;
        double corner1Y = y - halfHeight;
        double corner2X = x + halfWidth;
        double corner2Y = y - halfHeight;
        double corner3X = x + halfWidth;
        double corner3Y = y + halfHeight;
        double corner4X = x - halfWidth;
        double corner4Y = y + halfHeight;

        // Check if all corners are within the circle's reach
        return isPointWithinCircle(corner1X, corner1Y, circleX, circleY, circleRadius) ||
                isPointWithinCircle(corner2X, corner2Y, circleX, circleY, circleRadius) ||
                isPointWithinCircle(corner3X, corner3Y, circleX, circleY, circleRadius) ||
                isPointWithinCircle(corner4X, corner4Y, circleX, circleY, circleRadius);
    }

    public static boolean isPointWithinCircle(double pointX, double pointY, double centerX, double centerY, double radius) {
        // Calculate the distance from the point to the circle's center
        double distanceSquared = (pointX - centerX) * (pointX - centerX) + (pointY - centerY) * (pointY - centerY);
        // Check if the distance is less than or equal to the radius
        return distanceSquared <= radius * radius;
    }
}
