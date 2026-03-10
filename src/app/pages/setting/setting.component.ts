import { Component } from '@angular/core';
import { NzUploadChangeParam, NzUploadFile } from 'ng-zorro-antd/upload';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UsersService } from 'src/app/core/service/users.service';

@Component({
    templateUrl: './setting.component.html',
    standalone: false
})

export class SettingComponent {



    changePWForm: UntypedFormGroup;
    form: UntypedFormGroup

    avatarUrl: string = "http://www.themenate.net/applicator/dist/assets/images/avatars/thumb-13.jpg";
    selectedCountry: any;
    selectedLanguage: any;

    profile_picture_url: string;
    isConfirmLoading = false;
    brands_data: any;

    file!: File;


    networkList = [
        {
            name: 'Facebook',
            icon: 'facebook',
            avatarColor: '#4267b1',
            avatarBg: 'rgba(66, 103, 177, 0.1)',
            status: true,
            link: 'https://facebook.com'
        },
        {
            name: 'Instagram',
            icon: 'instagram',
            avatarColor: '#fff',
            avatarBg: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%,#d6249f 60%,#285AEB 90%)',
            status: false,
            link: 'https://instagram.com'
        },
        {
            name: 'Twitter',
            icon: 'twitter',
            avatarColor: '#1ca1f2',
            avatarBg: 'rgba(28, 161, 242, 0.1)',
            status: true,
            link: 'https://twitter.com'
        },
        {
            name: 'Dribbble',
            icon: 'dribbble',
            avatarColor: '#d8487e',
            avatarBg: 'rgba(216, 72, 126, 0.1)',
            status: false,
            link: 'https://dribbble.com'
        },
        {
            name: 'Github',
            icon: 'github',
            avatarColor: '#323131',
            avatarBg: 'rgba(50, 49, 49, 0.1)',
            status: true,
            link: 'https://github.com'
        },
        {
            name: 'Linkedin',
            icon: 'linkedin',
            avatarColor: '#0174af',
            avatarBg: 'rgba(1, 116, 175, 0.1)',
            status: true,
            link: 'https://linkedin.com'
        },
        {
            name: 'Dropbox',
            icon: 'dropbox',
            avatarColor: '#005ef7',
            avatarBg: 'rgba(0, 94, 247, 0.1)',
            status: false,
            link: 'https://dropbox.com'
        }
    ];

    notificationConfigList = [
        {
            title: "Everyone can look me up",
            desc: "Allow people found on your public.",
            icon: "user",
            color: "ant-avatar-blue",
            status: true
        },
        {
            title: "Everyone can contact me",
            desc: "Allow any peole to contact.",
            icon: "mobile",
            color: "ant-avatar-cyan",
            status: true
        },
        {
            title: "Show my location",
            desc: "Turning on Location lets you explore what's around you.",
            icon: "environment",
            color: "ant-avatar-gold",
            status: false
        },
        {
            title: "Email Notifications",
            desc: "Receive daily email notifications.",
            icon: "mail",
            color: "ant-avatar-purple",
            status: true
        },
        {
            title: "Unknow Source ",
            desc: "Allow all downloads from unknow source.",
            icon: "question",
            color: "ant-avatar-red",
            status: false
        },
        {
            title: "Data Synchronization",
            desc: "Allow data synchronize with cloud server",
            icon: "swap",
            color: "ant-avatar-green",
            status: true
        },
        {
            title: "Groups Invitation",
            desc: "Allow any groups invitation",
            icon: "usergroup-add",
            color: "ant-avatar-orange",
            status: true
        },
    ]

    constructor(private fb: UntypedFormBuilder, private modalService: NzModalService, private message: NzMessageService, private service: UsersService) {
        this.service.getUser().subscribe((res: any) => {
            console.log(res)
        })
        // console.log('hola')
    }

    ngOnInit(): void {
        this.getUserData()
        this.changePWForm = this.fb.group({
            oldPassword: [null, [Validators.required]],
            newPassword: [null, [Validators.required]],
            confirmPassword: [null, [Validators.required]]
        });
        this.form = this.fb.group({
            user_id: [null, Validators.required],
            name: [null, [Validators.required]],
            last_name: [null, [Validators.required]],
            company: [null, [Validators.required]],

        })
    }

    getUserData() {

        this.service.getUser().subscribe({
            next: (user: any) => {
                // console.log('Fetched users:', user);
                this.form.patchValue({
                    ...user,
                    user_id: user.id
                })
                this.profile_picture_url = user.profile_picture_url
                this.brands_data = user.brands

            },
            error: (error) => {
                console.error('Error fetching users:', error);
            }
        })
    }

    showConfirm(): void {
        this.modalService.confirm({
            nzTitle: '<i>Do you want to change your password?</i>',
            nzOnOk: () => this.message.success('Password Change Successfully')
        });
    }

    // submitForm(): void {
    //     for (const i in this.changePWForm.controls) {
    //         this.changePWForm.controls[i].markAsDirty();
    //         this.changePWForm.controls[i].updateValueAndValidity();
    //     }

    //     this.showConfirm();
    // }

    submitForm(): void {
        console.log(this.form.value)
        if (this.form.valid) {
            this.isConfirmLoading = true

                   const formData = new FormData();

                   formData.append('user_id', this.form.value.user_id)
                   formData.append('name', this.form.value.name)
                   formData.append('last_name', this.form.value.last_name)
                   formData.append('company', this.form.value.company)



            this.service.updateUser(formData, this.form.value.user_id).subscribe({
                next: (res) => {
                    console.log('User update successfully', res);
                    this.isConfirmLoading = false
                    // this.getUserData()

                },
                error: (err) => {
                    console.error('Error update user', err);
                }
            })
        } else {
            for (const i in this.form.controls) {
                this.form.controls[i].markAsDirty();
                this.form.controls[i].updateValueAndValidity();
            }
        }


        // this.showConfirm();
    }

    // private getBase64(img: File, callback: (img: {}) => void): void {
    //     const reader = new FileReader();
    //     reader.addEventListener('load', () => callback(reader.result));
    //     reader.readAsDataURL(img);
    // }

    convertToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {

            const reader = new FileReader();

            reader.readAsDataURL(file);

            reader.onload = () => {
                resolve(reader.result as string);
            };

            reader.onerror = error => reject(error);
        });
    }


    // handleChange(info: NzUploadChangeParam): void {

    //     console.log()

    //     if (info.file.status === 'done') {

    //         const fileObj = info.file.originFileObj as File;

    //         if (!fileObj) {
    //             console.error('Archivo no encontrado');
    //             return;
    //         }

    //         console.log('Archivo real:', fileObj);

    //         this.enviarArchivo();
    //     }
    // }




    enviarArchivo(): void {

        console.log(this.file)
        if (!this.file) {
            console.log('No hay archivo seleccionado');
            return;
        }

        const formData = new FormData();

        // Siempre enviar como string
        // formData.append('user_id', String(this.form.value.user_id));

        // Especificar nombre explícitamente
        formData.append('profile_picture', this.file);

        // console.log('Archivo que se enviará:', file);
        // console.log('Tamaño:', file.size);

        this.service.uploadPhoto(formData, this.form.value.user_id)
            .subscribe({
                next: (resp: any) => {
                    console.log('Subido correctamente', resp);
                    this.getUserData()
                },
                error: (error: any) => {
                    console.error('Error al subir', error);
                }
            });
    }


    beforeUpload = (file: File): boolean => {
        this.file = file;
        // console.log(this.file)
        this.enviarArchivo()
        return false; // 👈 IMPORTANTE: evita el auto upload
    };
}    