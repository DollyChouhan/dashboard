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

package persistentvolume

import (
	"log"

	v1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	client "k8s.io/client-go/kubernetes"
)

// PersistentVolumeDetail provides the presentation layer view of Kubernetes Persistent Volume resource.
type PersistentVolumeDetail struct {
	// Extends list item structure.
	PersistentVolume `json:",inline"`

	Message                string                    `json:"message"`
	PersistentVolumeSource v1.PersistentVolumeSource `json:"persistentVolumeSource"`
}

// GetPersistentVolumeDetail returns detailed clustermanagement about a persistent volume
func GetPersistentVolumeDetail(client client.Interface, name string) (*PersistentVolumeDetail, error) {
	log.Printf("Getting details of %s persistent volume", name)

	rawPersistentVolume, err := client.CoreV1().PersistentVolumesWithMultiTenancy("").Get(name, metaV1.GetOptions{})
	if err != nil {
		return nil, err
	}

	return getPersistentVolumeDetail(*rawPersistentVolume), nil
}

// GetPersistentVolumeDetailWithMultiTenancy returns detailed clustermanagement about a persistent volume
func GetPersistentVolumeDetailWithMultiTenancy(client client.Interface, tenant string, name string) (*PersistentVolumeDetail, error) {
	log.Printf("Getting details of %s persistent volume", name)

	rawPersistentVolume, err := client.CoreV1().PersistentVolumesWithMultiTenancy(tenant).Get(name, metaV1.GetOptions{})
	if err != nil {
		return nil, err
	}

	return getPersistentVolumeDetail(*rawPersistentVolume), nil
}

func getPersistentVolumeDetail(pv v1.PersistentVolume) *PersistentVolumeDetail {
	return &PersistentVolumeDetail{
		PersistentVolume:       toPersistentVolume(pv),
		Message:                pv.Status.Message,
		PersistentVolumeSource: pv.Spec.PersistentVolumeSource,
	}
}
