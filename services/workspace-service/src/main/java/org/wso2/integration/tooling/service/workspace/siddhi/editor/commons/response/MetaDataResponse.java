package org.wso2.integration.tooling.service.workspace.siddhi.editor.commons.response;

import org.wso2.integration.tooling.service.workspace.siddhi.editor.commons.metadata.MetaData;

import java.util.Map;

public class MetaDataResponse extends GeneralResponse {
    private MetaData inBuilt;
    private Map<String, MetaData> extensions;

    public MetaDataResponse(Status status) {
        super(status, null);
    }

    public MetaData getInBuilt() {
        return inBuilt;
    }

    public void setInBuilt(MetaData inBuilt) {
        this.inBuilt = inBuilt;
    }

    public Map<String, MetaData> getExtensions() {
        return extensions;
    }

    public void setExtensions(Map<String, MetaData> extensions) {
        this.extensions = extensions;
    }
}
