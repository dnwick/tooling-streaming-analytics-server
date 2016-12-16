package org.wso2.integration.tooling.service.workspace.rest;

import com.google.gson.Gson;
import org.wso2.integration.tooling.service.workspace.siddhi.editor.commons.request.ValidationRequest;
import org.wso2.integration.tooling.service.workspace.siddhi.editor.commons.response.GeneralResponse;
import org.wso2.integration.tooling.service.workspace.siddhi.editor.commons.response.MetaDataResponse;
import org.wso2.integration.tooling.service.workspace.siddhi.editor.commons.response.Status;
import org.wso2.integration.tooling.service.workspace.siddhi.editor.commons.response.ValidationSuccessResponse;
import org.wso2.integration.tooling.service.workspace.siddhi.editor.core.SourceEditorUtils;
import org.wso2.siddhi.core.ExecutionPlanRuntime;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 * HTTP Responses for siddhi editor related requests
 */
@Path("/siddhi-editor")
public class SourceEditorService {
    @POST
    @Path("/validator")
    public Response validateExecutionPlan(String validationRequestString) {
        ValidationRequest validationRequest = new Gson().fromJson(validationRequestString, ValidationRequest.class);
        String jsonString;

        try {
            ExecutionPlanRuntime executionPlanRuntime =
                    SourceEditorUtils.validateExecutionPlan(validationRequest.getExecutionPlan());

            // Status SUCCESS to indicate that the execution plan is valid
            ValidationSuccessResponse response = new ValidationSuccessResponse(Status.SUCCESS);

            // Getting requested inner stream definitions
            if (validationRequest.getMissingInnerStreams() != null) {
                response.setInnerStreams(SourceEditorUtils.getInnerStreamDefinitions(
                        executionPlanRuntime, validationRequest.getMissingInnerStreams()
                ));
            }

            // Getting requested stream definitions
            if (validationRequest.getMissingStreams() != null) {
                response.setStreams(SourceEditorUtils.getStreamDefinitions(
                        executionPlanRuntime, validationRequest.getMissingStreams()
                ));
            }

            jsonString = new Gson().toJson(response);
        } catch (Throwable t) {
            jsonString = new Gson().toJson(new GeneralResponse(Status.ERROR, t.getMessage()));
        }

        return Response.ok(jsonString, MediaType.APPLICATION_JSON)
                .header("Access-Control-Allow-Origin", "*")
                .build();
    }

    @GET
    @Path("/meta-data")
    public Response getMetaData() {
        MetaDataResponse response = new MetaDataResponse(Status.SUCCESS);
        response.setInBuilt(SourceEditorUtils.getInBuiltProcessorMetaData());
        response.setExtensions(SourceEditorUtils.getExtensionProcessorMetaData());

        String jsonString = new Gson().toJson(response);
        return Response.ok(jsonString, MediaType.APPLICATION_JSON)
                .header("Access-Control-Allow-Origin", "*")
                .build();
    }
}
