package org.wso2.integration.tooling.service.workspace.siddhi.editor.util;

import org.wso2.integration.tooling.service.workspace.siddhi.editor.commons.metadata.MetaData;

import java.util.Map;

/**
 * Used for holding the meta data of the processors available in the siddhi engine
 */
public class MetaDataHolder {
    private static MetaData inBuiltProcessorMetaData;
    private static Map<String, MetaData> extensionProcessorMetaData;

    private MetaDataHolder() {

    }

    /**
     * Returns the in built processor meta data
     *
     * @return In-built processor meta data
     */
    public static MetaData getInBuiltProcessorMetaData() {
        if (inBuiltProcessorMetaData == null) {
            inBuiltProcessorMetaData = SourceEditorUtils.getInBuiltProcessorMetaData();
        }
        return inBuiltProcessorMetaData;
    }

    /**
     * Returns the extension processor meta data
     *
     * @return Extension processor meta data
     */
    public static Map<String, MetaData> getExtensionProcessorMetaData() {
        if (extensionProcessorMetaData == null) {
            extensionProcessorMetaData = SourceEditorUtils.getExtensionProcessorMetaData();
        }
        return extensionProcessorMetaData;
    }
}
