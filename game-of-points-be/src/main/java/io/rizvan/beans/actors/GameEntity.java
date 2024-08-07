package io.rizvan.beans.actors;

import io.rizvan.beans.HitBox;

public abstract class GameEntity {
    protected String id;
    protected double x;
    protected double y;
    protected HitBox hitBox;

    public GameEntity() {}

    public GameEntity(double x, double y, int width, int height) {
        this.id = java.util.UUID.randomUUID().toString();
        this.x = x;
        this.y = y;
        this.hitBox = new HitBox(width, height);
    }

    public GameEntity(GameEntity other) {
        this.id = other.id;
        this.x = other.x;
        this.y = other.y;
        this.hitBox = new HitBox(other.hitBox.getWidth(), other.hitBox.getHeight());
    }

    public double getX() {
        return x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public double getY() {
        return y;
    }

    public void setY(double y) {
        this.y = y;
    }

    public HitBox getHitBox() {
        return hitBox;
    }

    public void setHitBox(HitBox hitBox) {
        this.hitBox = hitBox;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
