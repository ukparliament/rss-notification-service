.PHONY: build run test push rmi deploy-ecs checkout_to_release

##
# Makefile used to build, test and (locally) run the rss-notification project.
##

##
# ENVIRONMENT VARIABLES
#   We use a number of environment  variables to customer the Docker image createad at build time. These are set and
#   detailed below.
##

# App name used to created our Docker image. This name is important in the context of the AWS docker repository.
APP_NAME = parliamentuknotificationservice

# AWS account ID used to create our Docker image. This value is important in the context of the AWS docker repository.
# When executed in GoCD, AWS_ACCOUNT_ID may be set by an environment variable
AWS_ACCOUNT_ID ?= $(or $(shell aws sts get-caller-identity --output text --query "Account" 2 > /dev/null), unknown)

# A counter that represents the build number within GoCD. Used to tag and version our images.
GO_PIPELINE_COUNTER ?= unknown

# VERSION is used to tag the Docker images
VERSION = 0.0.$(GO_PIPELINE_COUNTER)

# ECS related variables used to build our image name
# Cluster: list all clusters to update, separated by semicolons
ECS_CLUSTER = ecs-apps
AWS_REGION = eu-west-1

# The name of our Docker image
IMAGE = $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com/$(APP_NAME)

# Container port used for mapping when running our Docker image.
CONTAINER_PORT = 3000

# Host port used for mapping when running our Docker image.
HOST_PORT = 119

##
# MAKE TASKS
#   Tasks used locally and within our build pipelines to build, test and run our Docker image.
##

GITHUB_API=https://api.github.com
ORG=ukparliament
REPO=rss-notification-service
LATEST_REL=$(GITHUB_API)/repos/$(ORG)/$(REPO)/releases
REL_TAG=$(shell curl -s $(LATEST_REL) | jq -r '.[0].tag_name')

checkout_to_release:
	git checkout -b release $(REL_TAG)

build: # Using the variables defined above, run `docker build`, tagging the image and passing in the required arguments.
	docker build -t $(IMAGE):$(VERSION) -t $(IMAGE):latest \
		--build-arg AWS_DYNAMODB_ENDPOINT=$(AWS_DYNAMODB_ENDPOINT) \
		--build-arg AWS_DYNAMODB_REGION=$(AWS_DYNAMODB_REGION) \
		--build-arg AWS_SES_ENDPOINT=$(AWS_SES_ENDPOINT) \
		--build-arg AWS_SES_FROM_EMAIL=$(AWS_SES_FROM_EMAIL) \
		--build-arg AWS_SES_REGION=$(AWS_SES_REGION) \
		--build-arg MC_API_KEY=$(MC_API_KEY) \
		--build-arg NODE_ENV=$(NODE_ENV) \
		.

run: # Run the Docker image we have created, mapping the HOST_PORT and CONTAINER_PORT
	docker run --rm -p $(HOST_PORT):$(CONTAINER_PORT) $(IMAGE)

push: # Push the Docker images we have build to the configured Docker repository (Run in GoCD to push the image to AWS)
	docker push $(IMAGE):$(VERSION)
	docker push $(IMAGE):latest

rmi: # Remove local versions of our images.
	docker rmi -f $(IMAGE):$(VERSION)
	docker rmi -f $(IMAGE):latest
	docker images -a | grep "^<none>" | awk '{print $3}' | xargs docker rmi || true

deploy-ecs: # Deploy our new Docker image onto an AWS cluster (Run in GoCD to deploy to various environments).
	./aws_ecs/register-task-definition.sh $(APP_NAME)
	./aws_ecs/update-services.sh "$(ECS_CLUSTER)" "$(APP_NAME)" "$(AWS_REGION)"
