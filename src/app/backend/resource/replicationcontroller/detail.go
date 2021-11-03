// Copyright 2017 The Kubernetes Authors.
// Copyright 2020 Authors of Arktos - file modified.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package replicationcontroller

import (
	"log"

	"github.com/kubernetes/dashboard/src/app/backend/errors"
	"github.com/kubernetes/dashboard/src/app/backend/resource/common"
	v1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	k8sClient "k8s.io/client-go/kubernetes"
)

// ReplicationControllerDetail represents detailed clustermanagement about a Replication Controller.
type ReplicationControllerDetail struct {
	// Extends list item structure.
	ReplicationController `json:",inline"`

	LabelSelector map[string]string `json:"labelSelector"`

	// List of non-critical errors, that occurred during resource retrieval.
	Errors []error `json:"errors"`
}

// ReplicationControllerSpec contains clustermanagement needed to update replication controller.
type ReplicationControllerSpec struct {
	// Replicas (pods) number in replicas set
	Replicas int32 `json:"replicas"`
}

// GetReplicationControllerDetail returns detailed clustermanagement about the given replication controller
// in the given namespace.
func GetReplicationControllerDetail(client k8sClient.Interface, namespace, name string) (*ReplicationControllerDetail, error) {
	log.Printf("Getting details of %s replication controller in %s namespace", name, namespace)

	replicationController, err := client.CoreV1().ReplicationControllersWithMultiTenancy(namespace, "").Get(name, metaV1.GetOptions{})
	if err != nil {
		return nil, err
	}

	podInfo, err := getReplicationControllerPodInfo(client, replicationController, namespace)
	nonCriticalErrors, criticalError := errors.HandleError(err)
	if criticalError != nil {
		return nil, criticalError
	}

	replicationControllerDetail := toReplicationControllerDetail(replicationController, podInfo, nonCriticalErrors)
	return &replicationControllerDetail, nil
}

// GetReplicationControllerDetailWithMultiTenancy returns detailed clustermanagement about the given replication controller
// in the given namespace.
func GetReplicationControllerDetailWithMultiTenancy(client k8sClient.Interface, tenant, namespace, name string) (*ReplicationControllerDetail, error) {
	log.Printf("Getting details of %s replication controller in %s namespace for %s", name, namespace, tenant)

	replicationController, err := client.CoreV1().ReplicationControllersWithMultiTenancy(namespace, tenant).Get(name, metaV1.GetOptions{})
	if err != nil {
		return nil, err
	}

	podInfo, err := getReplicationControllerPodInfoWithMultiTenancy(client, replicationController, tenant, namespace)
	nonCriticalErrors, criticalError := errors.HandleError(err)
	if criticalError != nil {
		return nil, criticalError
	}

	replicationControllerDetail := toReplicationControllerDetail(replicationController, podInfo, nonCriticalErrors)
	return &replicationControllerDetail, nil
}

// UpdateReplicasCount updates number of replicas in Replication Controller based on Replication Controller Spec
func UpdateReplicasCount(client k8sClient.Interface, namespace, name string, spec *ReplicationControllerSpec) error {
	log.Printf("Updating replicas count to %d for %s replication controller from %s namespace",
		spec.Replicas, name, namespace)

	replicationController, err := client.CoreV1().ReplicationControllersWithMultiTenancy(namespace, "").Get(name, metaV1.GetOptions{})
	if err != nil {
		return err
	}

	replicationController.Spec.Replicas = &spec.Replicas

	_, err = client.CoreV1().ReplicationControllersWithMultiTenancy(namespace, "").Update(replicationController)
	if err != nil {
		return err
	}

	log.Printf("Successfully updated replicas count to %d for %s replication controller from %s namespace",
		spec.Replicas, name, namespace)

	return nil
}

// UpdateReplicasCountWithMultiTenancy updates number of replicas in Replication Controller based on Replication Controller Spec
func UpdateReplicasCountWithMultiTenancy(client k8sClient.Interface, tenant, namespace, name string, spec *ReplicationControllerSpec) error {
	log.Printf("Updating replicas count to %d for %s replication controller from %s namespace for %s",
		spec.Replicas, name, namespace, tenant)

	replicationController, err := client.CoreV1().ReplicationControllersWithMultiTenancy(namespace, tenant).Get(name, metaV1.GetOptions{})
	if err != nil {
		return err
	}

	replicationController.Spec.Replicas = &spec.Replicas

	_, err = client.CoreV1().ReplicationControllersWithMultiTenancy(namespace, tenant).Update(replicationController)
	if err != nil {
		return err
	}

	log.Printf("Successfully updated replicas count to %d for %s replication controller from %s namespace for %s",
		spec.Replicas, name, namespace, tenant)

	return nil
}

func toReplicationControllerDetail(replicationController *v1.ReplicationController, podInfo *common.PodInfo, nonCriticalErrors []error) ReplicationControllerDetail {
	return ReplicationControllerDetail{
		ReplicationController: ToReplicationController(replicationController, podInfo),
		LabelSelector:         replicationController.Spec.Selector,
		Errors:                nonCriticalErrors,
	}
}
