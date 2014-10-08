var rbsBehaviours = {
	resources: {
		contrib: {
			right: 'fr-wseduc-rbs-controllers-BookingController|createBooking'
		},
		process: {
			right: 'fr-wseduc-rbs-controllers-BookingController|processBooking'
		},
		manage: {
			right: 'fr-wseduc-rbs-controllers-ResourceTypeController|updateResourceType'
		},
		share: {
			right: 'fr-wseduc-rbs-controllers-ResourceTypeController|shareJson'
		}
	},
	workflow: {
		typemanage: 'fr.wseduc.rbs.controllers.ResourceTypeController|createResourceType',
		ressourcemanage: 'fr.wseduc.rbs.controllers.ResourceController|create',
		validator: 'fr.wseduc.rbs.controllers.BookingController|listUnprocessedBookings',
	}
};

Behaviours.register('rbs', {
	behaviours: rbsBehaviours,
	resource: function(resource){
		var rightsContainer = resource;
		
		if(resource instanceof Resource && resource.type){
			rightsContainer = resource.type;
		}
		if(resource instanceof Booking && resource.resource && resource.resource.type){
			rightsContainer = resource.resource.type;
		}
		
		if(!resource.myRights){
			resource.myRights = {};
		}

		for(var behaviour in rbsBehaviours.resources){ // resource.owner currently directly contains Id
			if(model.me.userId === resource.owner || model.me.userId === rightsContainer.owner || model.me.hasRight(rightsContainer, rbsBehaviours.resources[behaviour])){
				if(resource.myRights[behaviour] !== undefined){
					resource.myRights[behaviour] = resource.myRights[behaviour] && rbsBehaviours.resources[behaviour];
				}
				else{
					resource.myRights[behaviour] = rbsBehaviours.resources[behaviour];
				}
			}
		}
		return resource;
	},
	workflow: function(){
		var workflow = { };
		var rbsWorkflow = rbsBehaviours.workflow;
		for(var prop in rbsWorkflow){
			if(model.me.hasWorkflow(rbsWorkflow[prop])){
				workflow[prop] = true;
			}
		}

		return workflow;
	},
	resourceRights: function(){
		return ['read', 'contrib', 'publish', 'manager']
	}
});