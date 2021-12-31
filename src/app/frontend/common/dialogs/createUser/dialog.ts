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



import {Component, OnInit, Inject} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient, HttpHeaders} from '@angular/common/http';

import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {AbstractControl, Validators,FormBuilder} from '@angular/forms';

import { FormGroup} from '@angular/forms';
import {CONFIG} from "../../../index.config";
import {CsrfTokenService} from "../../services/global/csrftoken";
import {AlertDialog, AlertDialogConfig} from "../alert/dialog";

import {NamespacedResourceService} from '../../services/resource/resource';
import {SecretDetail} from '@api/backendapi';

export interface UserToken {
  token: string;
}

export interface CreateUserDialogMeta {
  tenants: string;
  storageclusterid: string;
}
@Component({
  selector: 'kd-create-tenant-dialog',
  templateUrl: 'template.html',
})

export class CreateUserDialog implements OnInit {
  form1: FormGroup;
  namespaceUsed = "default"
  adminroleUsed = "cluster-admin";
  apiGroups : string [] =["", "extensions", "apps"]
  resources : string [] =["deployments", "pods", "services", "secrets", "namespaces"]
  verbs :string []= ["*"]
  serviceAccountCreated:any[] = [];
  secretDetails:any[] = [];

  private readonly config_ = CONFIG;

  /**
   * Max-length validation rule for tenant
   */
  tenantMaxLength = 24;
  storageidMaxLength =10;
  /**
   * Pattern validation rule for tenant
   */
  tenantPattern: RegExp = new RegExp('^[a-z0-9]([-a-z0-9]*[a-z0-9])?$');
  storageidPattern: RegExp = new RegExp('^[0-9]$');
  /**
   * Max-length validation rule for namespace
   */
  namespaceMaxLength = 63;
  /**
   * Pattern validation rule for namespace
   */
  namespacePattern: RegExp = new RegExp('^[a-z0-9]([-a-z0-9]*[a-z0-9])?$');

  secret: SecretDetail;
  secret1: SecretDetail;
  secretName =""
  secretToken:string;
  secretData: any[]=[];
  testname="notFound"

  constructor(
    private readonly secret_: NamespacedResourceService<SecretDetail>,
    public dialogRef: MatDialogRef<CreateUserDialog>,
    @Inject(MAT_DIALOG_DATA) public data: CreateUserDialogMeta,
    private readonly http_: HttpClient,
    private readonly csrfToken_: CsrfTokenService,
    private readonly matDialog_: MatDialog,
    private readonly fb_: FormBuilder,

  ) {}

  ngOnInit(): void {
    this.form1 = this.fb_.group({
        usertype: [
          '',
          Validators.compose([
            Validators.maxLength(this.tenantMaxLength),
            Validators.pattern(this.tenantPattern),
          ]),
        ],
        tenant: [
          '',
          Validators.compose([
            Validators.maxLength(this.tenantMaxLength),
            Validators.pattern(this.tenantPattern),
          ]),
        ],
        username: [
          '',
          Validators.compose([
            Validators.maxLength(this.tenantMaxLength),
            Validators.pattern(this.tenantPattern),
          ]),
        ],
        password: [
          '',
          Validators.compose([
            Validators.maxLength(this.tenantMaxLength),
            Validators.pattern(this.tenantPattern),
          ]),
        ],
        storageclusterid :[
          '',
          Validators.compose([
            Validators.maxLength(this.storageidMaxLength),
            Validators.pattern(this.storageidPattern),
          ]),
        ],

      },
    );

  }

  get tenant(): AbstractControl {
    return this.form1.get('tenant');
  }
  get user(): AbstractControl {
    return this.form1.get('username');
  }
  get pass(): AbstractControl {
    return this.form1.get('password');
  }

  get usertype(): AbstractControl {
    return this.form1.get('usertype');
  }

  get storageclusterid(): AbstractControl {
    return this.form1.get('storageclusterid');
  }

  createUser(usertoken :string) {
    const userSpec= {id:1,username: this.user.value, password:this.pass.value, token:usertoken, type:this.usertype.value,tenantname:this.tenant.value};
    const userTokenPromise = this.csrfToken_.getTokenForAction('users');
    // const tokenPromisenamespace = this.csrfToken_.getTokenForAction('namespace');
    userTokenPromise.subscribe(csrfToken => {
      return this.http_
        .post<{valid: boolean}>(
          'api/v1/users',
          {...userSpec},
          {
            headers: new HttpHeaders().set(this.config_.csrfHeaderName, csrfToken.token),
          },
        )
        .subscribe(
          () => {
            this.dialogRef.close(this.user.value);
          },

        );
    });
  }
  // create role
  createRole(): void {
    const tenantSpec= {name: this.user.value, namespace: this.namespaceUsed, apiGroups: this.apiGroups,verbs: this.verbs,resources: this.resources};
    const tokenPromise = this.csrfToken_.getTokenForAction('role');
    tokenPromise.subscribe(csrfToken => {
      return this.http_
        .post<{valid: boolean}>(
          'api/v1/role',
          {...tenantSpec},
          {
            headers: new HttpHeaders().set(this.config_.csrfHeaderName, csrfToken.token),
          },
        )
        .subscribe(
          () => {
            this.dialogRef.close(this.user.value);
          },
          error => {
            this.dialogRef.close();
            const configData: AlertDialogConfig = {
              title: 'Error creating Role',
              message: error.data,
              confirmLabel: 'OK',
            };
            this.matDialog_.open(AlertDialog, {data: configData});
          },
        );
    });
  }
  // create clusterrole
  createClusteRole(): void {
    const clusterroleSpec= {name: this.user.value,apiGroups: this.apiGroups,verbs: this.verbs,resources: this.resources};
    const tokenPromise = this.csrfToken_.getTokenForAction('clusterrole');
    tokenPromise.subscribe(csrfToken => {
      return this.http_
        .post<{valid: boolean}>(
          'api/v1/clusterrole',
          {...clusterroleSpec},
          {
            headers: new HttpHeaders().set(this.config_.csrfHeaderName, csrfToken.token),
          },
        )
        .subscribe(
          () => {
            this.dialogRef.close(this.user.value);
          },
          error => {
            this.dialogRef.close();
            const configData: AlertDialogConfig = {
              title: 'Error creating Clusterrole',
              message: error.data,
              confirmLabel: 'OK',
            };
            this.matDialog_.open(AlertDialog, {data: configData});
          },
        );
    });
  }
  // create service account
  createServiceAccount() {
    const serviseaccountSpec= {name: this.user.value,namespace: this.namespaceUsed};
    const tokenPromise = this.csrfToken_.getTokenForAction('serviceaccount');
    tokenPromise.subscribe(csrfToken => {
      return this.http_
        .post<{valid: boolean}>(
          'api/v1/serviceaccount',
          {...serviseaccountSpec},
          {
            headers: new HttpHeaders().set(this.config_.csrfHeaderName, csrfToken.token),
          },
        )
        .subscribe(
          (data) => {
            this.dialogRef.close(this.user.value);
            this.serviceAccountCreated.push(Object.entries(data))
            },
        );
    })
  }
  createRoleBinding(): void{
    const rbSpec= {name: this.user.value,namespace: this.namespaceUsed, subject: { kind: "ServiceAccount", name: this.user.value,  namespace : this.namespaceUsed, apiGroup : ""},role_ref:{kind: "Role",name: this.user.value,apiGroup: "rbac.authorization.k8s.io"}};
    const tokenPromise = this.csrfToken_.getTokenForAction('rolebindings');
    tokenPromise.subscribe(csrfToken => {
      return this.http_
        .post<{valid: boolean}>(
          'api/v1/rolebindings',
          {...rbSpec},
          {
            headers: new HttpHeaders().set(this.config_.csrfHeaderName, csrfToken.token),
          },
        )
        .subscribe(
          () => {
            this.dialogRef.close(this.user.value);
          },
        );
    })

  }
  createClusterRoleBinding(): void{
    if( this.usertype.value == "TenantAdmin")
    {
      this.adminroleUsed = this.user.value
    }
    const crbSpec= {name: this.user.value,namespace: this.namespaceUsed, subject: { kind: "ServiceAccount", name: this.user.value,  namespace : this.namespaceUsed, apiGroup : ""},role_ref:{kind: "ClusterRole",name: this.adminroleUsed,apiGroup: "rbac.authorization.k8s.io"}};
    const tokenPromise = this.csrfToken_.getTokenForAction('clusterrolebindings');
    tokenPromise.subscribe(csrfToken => {
      return this.http_
        .post<{valid: boolean}>(
          'api/v1/clusterrolebindings',
          {...crbSpec},
          {
            headers: new HttpHeaders().set(this.config_.csrfHeaderName, csrfToken.token),
          },
        )
        .subscribe(
          () => {
            this.dialogRef.close(this.user.value);
          },
        );
    })

  }
  //to decode token
  decode(s: string): string {
    return atob(s);
  }
  //  Creates new tenant based on the state of the controller.
  createTenant(): void {
    const tenantSpec= {name: this.user.value,storageclusterid: this.storageclusterid.value};
    const tokenPromise = this.csrfToken_.getTokenForAction('tenant');
    tokenPromise.subscribe(csrfToken => {
      return this.http_
        .post<{valid: boolean}>(
          'api/v1/tenant',
          {...tenantSpec},
          {
            headers: new HttpHeaders().set(this.config_.csrfHeaderName, csrfToken.token),
          },
        )
        .subscribe(
          () => {
            this.dialogRef.close(this.tenant.value);
          },
          error => {
            this.dialogRef.close();
            const configData: AlertDialogConfig = {
              title: 'Tenant Already Exists',
              message: error.data,
              confirmLabel: 'OK',
            };
            this.matDialog_.open(AlertDialog, {data: configData});
          },
        );
    });
  }

  // Get Secret name
  getSecretName() : string {
    this.http_.get("api/v1/secret/default").subscribe((data:any)=>{
      const serviceaccount=this.user.value
      const searchSecret=serviceaccount+"-token"
      const queryStr = new RegExp(searchSecret,"gi");
      const stringDataForm:string=JSON.stringify(data).toString()
      const splitDataString:string =stringDataForm.split('"').toString().trim();
      const splitArray = splitDataString.split(",")

      for(let j=0; j< splitArray.length; j++){
        const element:string = splitArray[j]
        if(element.search(queryStr)!=-1)
        {
          this.secretName=element
        }
      }

      if(this.secretName!=""){
        this.testname="Found"
        this.getTokenFromSecret(this.secretName)
      }
    });
    return this.secretName
  }

  getTokenFromSecret(secret_name:string) {
    const tokenUrl="api/v1/secret/default/"+secret_name
    this.http_.get(tokenUrl).subscribe((data : any )=>{
      const stringDataForm:string = JSON.stringify(data).toString()
      const split_array:string[] =stringDataForm.split(',');
      const match_array:string[]=[];
      split_array.forEach((element)=>{
        const row:string = element.toString()
        const re=/token/g
        let restemp_result:string[]=[];
        if(row.search(re)!= -1){
          restemp_result=row.split(':')
          match_array.push(restemp_result.toString())
        }
      })
      const values:string[] = match_array[2].split(',')
      let token_value:string;
      for(let j=0;j<values.length;j++)
      {
        if(j==1)
        {
          token_value=values[j].trim()
        }
      }
      const final_token:string=this.decode(token_value.substring(1,token_value.length-3))
      this.createUser(final_token)
    });
  }

  createTenantUser() {
    this.createTenant()
    this.createServiceAccount()

    if(this.usertype.value == "TenantUser"){
      //console.log("Call... create role fun()")
      this.createRole()
      this.createRoleBinding()
    } else {
      //console.log("Call... create clusterrole fun()")
      this.createClusteRole()
      this.createClusterRoleBinding()
    }
    let temp:string=this.getSecretName()
    temp=this.getSecretName()
    if(temp.localeCompare("")===-1)
    {
      const t1:string=this.getSecretName()
    }
  }
  isCreateDisabled(): boolean {
    return !this.user.value || !this.pass.value || !this.usertype.value;
  }
  /**
   * Returns true if new tenant name hasn't been filled by the user, i.e, is empty.
   */
  isDisabled(): boolean {
    return this.data.tenants.indexOf(this.tenant.value) >= 0;
  }

  /**
   * Cancels the new tenant form.
   */
  cancel(): void {
    this.dialogRef.close();
  }
}
