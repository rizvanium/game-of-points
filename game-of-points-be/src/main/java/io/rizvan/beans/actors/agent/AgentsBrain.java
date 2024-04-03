package io.rizvan.beans.actors.agent;
import io.rizvan.beans.actors.agent.Agent;
import io.rizvan.beans.facts.Fact;

import java.util.List;

public interface AgentsBrain {
    void reason(List<Fact> facts, Agent agent);
}