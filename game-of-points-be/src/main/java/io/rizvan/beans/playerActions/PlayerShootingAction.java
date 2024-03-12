package io.rizvan.beans.playerActions;

import io.rizvan.beans.actors.CompetingEntity;

public class PlayerShootingAction extends PlayerAction {
    private double mouseX;
    private double mouseY;

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

    @Override
    public boolean check(CompetingEntity entity1, CompetingEntity entity2) {
        return false;
    }
}
