package io.rizvan.beans;

import io.rizvan.beans.actors.Agent;
import io.rizvan.beans.actors.Player;

public class GameState {
    private Player player;
    private Agent agent;

    public GameState(Player player, Agent agent) {
        this.player = player;
        this.agent = agent;
    }

    public Player getPlayer() {
        return player;
    }

    public void setPlayer(Player player) {
        this.player = player;
    }

    public Agent getAgent() {
        return agent;
    }

    public void setAgent(Agent agent) {
        this.agent = agent;
    }
}