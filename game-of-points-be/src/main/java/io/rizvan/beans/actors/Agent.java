package io.rizvan.beans.actors;

import io.rizvan.beans.PlayerInfo;
import io.rizvan.beans.RangedWeapon;

public class Agent extends CompetingEntity {
    private PlayerInfo playerInfo;

    public enum Type {
        SNIPER(3, 0, 0, 50, 50, 1.0, 0, RangedWeapon.Type.SNIPER.get()),
        SOLDIER(3, 0, 0, 50, 50, 1.0, 0, RangedWeapon.Type.CARBINE.get()),
        SCOUT(3, 0, 0, 50, 50, 1.0, 0, RangedWeapon.Type.SUB_MACHINE.get()),
        SPEED_DEMON(3, 0, 0, 50, 50, 1.0, 0, RangedWeapon.Type.PISTOL.get());

        private final Agent agent;

        Type(int hp, double x, double y, double width, double height, double speed, int points, RangedWeapon weapon) {
            this.agent = new Agent(hp, x, y, width, height, speed, points, weapon);
        }

        public Agent get() {
            return agent;
        }
    }

    public Agent(int hitPoints, double x, double y, double width, double height, double speed, int points, RangedWeapon weapon) {
        super(hitPoints, x, y, width, height, speed, points, weapon);
    }

}