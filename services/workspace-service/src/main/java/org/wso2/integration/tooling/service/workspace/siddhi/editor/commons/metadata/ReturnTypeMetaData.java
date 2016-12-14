package org.wso2.integration.tooling.service.workspace.siddhi.editor.commons.metadata;

import java.util.List;

/**
 * For storing return value meta data of a processor
 * Used in JSON responses
 */
public class ReturnTypeMetaData {
    private List<String> type;
    private String description;

    public List<String> getType() {
        return type;
    }

    public void setType(List<String> type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
