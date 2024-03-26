package io.rizvan.beans.actors;

import io.rizvan.beans.AgentKnowledge;
import io.rizvan.beans.KnowledgeUpdateSignal;
import io.rizvan.beans.facts.Fact;
import jakarta.annotation.PreDestroy;
import org.kie.api.KieServices;
import org.kie.api.runtime.KieContainer;
import org.kie.api.runtime.KieSession;

import java.util.List;

public class DroolsBrain implements AgentsBrain {

    private final AgentKnowledge knowledge;
    // I want KieSession to reside here
    private final KieContainer kieContainer;

    public DroolsBrain() {
        knowledge = new AgentKnowledge();
        KieServices kieService = KieServices.Factory.get();
        kieContainer = kieService.getKieClasspathContainer();
    }

    @Override
    public void reason(List<Fact> facts, Agent agent) {
        KieSession kieSession = kieContainer.newKieSession("myKsession");
        kieSession.insert(knowledge);
        kieSession.insert(new KnowledgeUpdateSignal());

        try {
            facts.forEach(kieSession::insert);

            kieSession.getAgenda().getAgendaGroup("inference-group").setFocus();
            kieSession.fireAllRules();

            kieSession.getAgenda().getAgendaGroup("possibilities-group").setFocus();
            kieSession.fireAllRules();

            System.out.println(knowledge);
        } finally {
            kieSession.dispose();
        }
    }

    @PreDestroy
    public void cleanup() {
        if (kieContainer != null) {
            kieContainer.dispose();
        }
    }
}
