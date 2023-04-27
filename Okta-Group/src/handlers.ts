import {AbstractOktaResource} from "../../Okta-Common/src/abstract-okta-resource";
import {ResourceModel, TypeConfigurationModel} from './models';
import {OktaClient} from "../../Okta-Common/src/okta-client";

import {version} from '../package.json';

interface CallbackContext extends Record<string, any> {}

class Resource extends AbstractOktaResource<ResourceModel, ResourceModel, ResourceModel, ResourceModel, TypeConfigurationModel> {

    private userAgent = `AWS CloudFormation (+https://aws.amazon.com/cloudformation/) CloudFormation resource ${this.typeName}/${version}`;

    async get(model: ResourceModel, typeConfiguration: TypeConfigurationModel): Promise<ResourceModel> {
        const response = await new OktaClient(typeConfiguration.oktaAccess.url, typeConfiguration.oktaAccess.apiKey, this.userAgent).doRequest<ResourceModel>(
            'get',
            `/api/v1/groups/${model.id}`);
        const result = new ResourceModel(response.data);
	// TEST this causes the update / create to fail because it isn't returning the inputs exactly.
	result.profile.description = 'Test123';
	// TEST this causes a test failure due to returning a writeOnlyProperty (To trigger this use the extra json config and run cfn generate + npm run build)
	result.writeOnlyTest = 'This is writeonly property';
	return result;
    }

    async list(model: ResourceModel, typeConfiguration: TypeConfigurationModel): Promise<ResourceModel[]> {
        const response = await new OktaClient(typeConfiguration.oktaAccess.url, typeConfiguration.oktaAccess.apiKey, this.userAgent).doRequest<ResourceModel[]>(
            'get',
            `/api/v1/groups`);

        const result = response.data.map(group => this.setModelFrom(new ResourceModel(), new ResourceModel(group)));
	// TEST this causes the list tests to fail because it isn't finding the expected id. 
	result[0].id = 'abc123';
	return result;
    }

    async create(model: ResourceModel, typeConfiguration: TypeConfigurationModel): Promise<ResourceModel> {
        const response = await new OktaClient(typeConfiguration.oktaAccess.url, typeConfiguration.oktaAccess.apiKey, this.userAgent).doRequest<ResourceModel>(
            'post',
            `/api/v1/groups`,
            {},
            model.toJSON(),
            this.loggerProxy);
        const result = new ResourceModel(response.data);
	// @ts-ignore
	result.profile.description = 'New Test by Josh';
	return result;
    }

    async update(model: ResourceModel, typeConfiguration: TypeConfigurationModel): Promise<ResourceModel> {
        let modelForDelete: ResourceModel = new ResourceModel({
            profile: model.profile
        });
        const response = await new OktaClient(typeConfiguration.oktaAccess.url, typeConfiguration.oktaAccess.apiKey, this.userAgent).doRequest<ResourceModel>(
            'put',
            `/api/v1/groups/${model.id}`,
            {},
            modelForDelete.toJSON(),
            this.loggerProxy);

        const result = new ResourceModel(response.data);

	result.profile.description = 'This is a test1';
	return result;
    }

    async delete(model: ResourceModel, typeConfiguration: TypeConfigurationModel): Promise<void> {
	    // TEST TODO need to remove this functionality so it causes the delete tests to fail.
        await new OktaClient(typeConfiguration.oktaAccess.url, typeConfiguration.oktaAccess.apiKey, this.userAgent).doRequest<ResourceModel>(
            'delete',
            `/api/v1/groups/${model.id}`);
    }

    newModel(partial: any): ResourceModel {
        return new ResourceModel(partial);
    }

    setModelFrom(model: ResourceModel, from: ResourceModel | undefined): ResourceModel {
        if (!from) {
            return model;
        }
        let result =  new ResourceModel({
            ...model,
            ...from
        });
        // Delete a couple of unused fields that are returned by the API
        // as they are subject to change server-side
        delete (<any>result)?.lastUpdated;
        delete (<any>result)?.created;
        delete (<any>result)?._links;
        delete (<any>result)?.lastMembershipUpdated;
        delete (<any>result)?.objectClass;
        delete (<any>result)?.type;
        return result;
    }


}

export const resource = new Resource(ResourceModel.TYPE_NAME, ResourceModel, null, null, TypeConfigurationModel);

// Entrypoint for production usage after registered in CloudFormation
export const entrypoint = resource.entrypoint;

// Entrypoint used for local testing
export const testEntrypoint = resource.testEntrypoint;
