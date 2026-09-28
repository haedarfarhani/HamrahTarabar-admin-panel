# Backend-loading — پروژه جامع باربری و حمل بار

## خلاصه

این پروژه یک **سیستم مدیریت حمل بار** (Loading System) است که به عنوان یک پلتفرم آنلاین برای اتصال صاحبان بار (Load Owners) و رانندگان (Drivers) عمل می‌کند. پروژه با معماری **Clean Architecture** و فریمورک **ASP.NET Core 9.0** ساخته شده و از PostgreSQL به عنوان پایگاه داده استفاده می‌کند.

---

## فناوری‌های اصلی

| لایه           | تکنولوژی                              |
| -------------- | ------------------------------------- |
| Framework      | .NET 9.0                              |
| ORM            | Entity Framework Core 9.0             |
| Database       | PostgreSQL (Npgsql.EntityFrameworkCore.PostgreSQL) |
| Cache          | Redis (StackExchange.Redis)           |
| Authentication | JWT Bearer + Refresh Token            |
| SMS Provider   | Kavenegar (ایرانی)                    |
| Logging        | Serilog                               |
| API Docs       | Swagger / Swashbuckle                 |
| Caching        | Redis + Memory Cache + Response Cache |

---

## ساختار پروژه (Clean Architecture)

```
Backend-loading/
├── Loading.Domain/                  ← لایه Domain (هیچ وابستگی ندارد)
│   ├── Users/                       ← User, Role, Permission, UserRole, RolePermission, LoginHistory
│   ├── Cargos/                      ← CargoLoad, CargoType, CargoImage, CargoReview, DriverInterest
│   ├── Cities/                      ← Province, City
│   ├── Vehicles/                    ← VehicleType, VehicleSubType
│   └── Configuration/               ← AppVersion, GlobalAppConfig, AppLink, SystemMessage, MaintenanceMode, FeatureFlag + Enums
│
├── Loading.Application/             ← لایه Application (Interfaces + DTOs + Services)
│   ├── Users/                       ← IUserService, IUserRepository, IRoleService, IPermissionService + DTOs
│   ├── Cargos/                      ← ICargoService, ICargoRepository + DTOs + SearchFilter
│   ├── Cities/                      ← ICitiesService, ICitiesRepository + DTOs
│   ├── Vehicles/                    ← IVehicleService, IVehicleRepository + DTOs
│   ├── Configuration/               ← IAppVersionService, IGlobalAppConfigService, IAppLinkService, ISystemMessageService, IMaintenanceModeService, IFeatureFlagService + Repos
│   ├── Otps/                        ← IOtpService + DTOs
│   ├── Auth/                        ← IAuthService + DTOs (Login, Refresh, Register, Password)
│   └── Sms/                         ← ISmsService
│
├── Loading.Infrastructure.Data/     ← لایه Infrastructure (پیاده‌سازی Repository + Service)
│   ├── Context/                     ← ApplicationDbContext (EF Core)
│   ├── Users/                       ← UserService, UserRepository, RoleService, PermissionService, AdminUserSeeder
│   ├── Auth/                        ← AuthService
│   ├── Cargos/                      ← CargoService, CargoRepository
│   ├── Cities/                      ← CitiesService, CitiesRepository, CitySeeder
│   ├── Vehicles/                    ← VehicleService, VehicleRepository
│   ├── Configuration/               ← پیاده‌سازی Configuration Services + Repos
│   ├── Otps/                        ← OtpService
│   └── Sms/                         ← KavenegarSmsService
│
├── Loading.Infrastructure.IoC/      ← Dependency Injection (ثبت تمام سرویس‌ها)
│   └── DependencyInjection.cs       ← AddInfrastructure() — تنظیمات JWT, DB, Auth, Redis, CORS
│
├── Loading.UI.RESTAPI/              ← لایه API (Controllers + Middleware)
│   ├── Controllers/
│   │   ├── V1/
│   │   │   └── AuthController       ← api/v1/auth (login, refresh, logout, register, forgot-password, reset-password, change-password, me)
│   │   ├── Admin/
│   │   │   ├── AdminUsersController ← api/v1/AdminUsers (user CRUD, activate, deactivate, assign/remove roles)
│   │   │   ├── RolesController      ← api/v1/Roles (role CRUD, assign/remove permissions)
│   │   │   └── PermissionsController← api/v1/Permissions (permission CRUD, by-category)
│   │   ├── User/
│   │   │   ├── UsersController      ← api/v1/Users (register, current user, update profile, change password, admin: list/edit/delete/activate/deactivate/lock/unlock/block/unblock users with user type info)
│   │   │   └── AuthController       ← api/sessions, api/tokens/refresh (legacy - being phased out)
│   │   ├── Cargos/
│   │   │   ├── CargosController     ← api/cargos (search, create, edit, delete, status)
│   │   │   ├── CargoReviewsController ← cargo reviews
│   │   │   ├── CargoInterestsController ← driver interests
│   │   │   ├── CargoImagesController ← cargo images
│   │   │   └── CargoAdminController ← statistics, my-cargos, interested-cargos
│   │   ├── CitiesController         ← api/cities
│   │   ├── ProvincesController      ← api/provinces
│   │   ├── VehicleTypesController   ← api/vehicletypes
│   │   ├── OtpController            ← api/otp
│   │   ├── GlobalAppConfigController← api/globalappconfig
│   │   ├── FeatureFlagsController   ← api/featureflags
│   │   ├── MaintenanceController    ← api/maintenance
│   │   ├── SystemMessagesController ← api/systemmessages
│   │   ├── AppVersionsController    ← api/appversions
│   │   └── AppLinksController       ← api/applinks
│   ├── Middlewares/                  ← RequestResponseLoggingMiddleware (فعلاً غیرفعال)
│   └── Program.cs                   ← Entry Point + Pipeline
│
└── Backend-loading.sln
```

---

## وابستگی پروژه‌ها

```
Loading.Domain  (هیچ وابستگی)
       ↑
Loading.Application  → Domain
       ↑
Loading.Infrastructure.Data  → Application
       ↑
Loading.Infrastructure.IoC  → Application, Infrastructure.Data
       ↑
Loading.UI.RESTAPI  → Application, Infrastructure.Data, Infrastructure.IoC
```

---

## مدل داده‌ای (Domain Entities)

### 1. کاربران (Users)

| Entity           | توضیح                                                                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `User`           | کاربر سیستم — شامل UserID, UserName, FirstName, LastName, PhoneNumber, PasswordHash, UserTypeId, LivingAddress (Province/City/Street/PostalCode), LivingLocation (Latitude/Longitude), VehicleType, RefreshToken, TwoFactorEnabled, LockoutEndDate |
| `UserType`       | نوع کاربر — Administrator, Driver, LoadOwner |
| `Role`           | نقش کاربر — Administrator, Driver, LoadOwner                                                                                                                                 |
| `Permission`     | دسترسی — Users.View, Users.Create, Users.Edit, Users.Delete, Roles.View, Roles.Manage, Permissions.View, Permissions.Manage                                                  |
| `UserRole`       | جدول اتصال User ↔ Role                                                                                                                                                       |
| `RolePermission` | جدول اتصال Role ↔ Permission                                                                                                                                                 |
| `LoginHistory`   | تاریخچه ورود — شامل IpAddress, DeviceInfo, EventType, Browser, OperatingSystem                                                                                               |

**سیستم نقش‌ها (RBAC):**

- **Administrator**: تمام دسترسی‌ها
- **Driver**: فقط Users.View
- **LoadOwner**: Users.View, Users.Create, Users.Edit, Roles.View

### 2. بارها (Cargos)

| Entity           | توضیح                                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CargoLoad`      | محموله اصلی — Origin/Destination (Province+City+Address+Lat/Lng), CargoType, Weight, Volume, VehicleType/SubType, FreightCastType, Freight, Currency, LoadingDate, ContactPhone, Status, ViewCount, IsUrgent, RequiresInsurance |
| `CargoType`      | نوع بار — مواد غذایی, مواد ساختمانی, فلزات, مواد شیمیایی, لوازم خانگی, خودرو, محصولات کشاورزی, سایر                                                                                                                             |
| `CargoImage`     | تصاویر بار                                                                                                                                                                                                                      |
| `CargoReview`    | نظرات و امتیازات رانندگان (1-5 ستاره)                                                                                                                                                                                           |
| `DriverInterest` | علاقه‌مندی رانندگان به بار — شامل ProposedFreight و Status                                                                                                                                                                      |

**وضعیت‌های بار (CargoStatus):**

```
Draft → UnderReview → Approved → Published → Completed
                     ↘ Rejected
              ↘ Cancelled
              ↘ Expired
              ↘ InProgress
              ↘ OnHold
```

**نوع قیمت‌گذاری (FreightCastType):**

- PerTon (به ازای هر تن)
- TotalLoad (کل بار)
- Negotiable (توافقی)
- PerKilometer (به ازای هر کیلومتر)
- Fixed (ثابت)

### 3. وسایل نقلیه (Vehicles)

| Entity           | توضیح                                         |
| ---------------- | --------------------------------------------- |
| `VehicleType`    | نوع وسیله نقلیه — Name, Icon, MaxLoadCapacity |
| `VehicleSubType` | زیرنوع وسیله — وابسته به VehicleType          |

**انواع وسایل نقلیه:**
| نوع | زیرنوع‌ها | ظرفیت (تن) |
|-----|----------|------------|
| تریلی | کفی، ترانزیت (چادری)، لبه دار، نیم لبه، کانتینر بر | 40 |
| کمپرسی | تک، جفت، تریلی | 25 |
| اتاق دار (باری) | تک، جفت، خاور، 911 | 20 |
| یخچالدار | خاور، تک، جفت، تریلی | 20 |
| کانتینر دار | 40 فوت، 20 فوت | 30 |
| مسقف | تک، جفت، خاور | 15 |
| کمرشکن | 2-11 محور | 50 |
| وانت بار | وانت سبک، نیسان | 1.5 |
| تانکر (مخزندار) | تانکر | 30 |
| بونکر | بونکر | 35 |

### 4. شهرها (Cities)

| Entity     | توضیح                                               |
| ---------- | --------------------------------------------------- |
| `Province` | استان — Name                                        |
| `City`     | شهر — Name, CityName, Province, Latitude, Longitude |

### 5. پیکربندی (Configuration)

| Entity            | توضیح                                                                      |
| ----------------- | -------------------------------------------------------------------------- |
| `AppVersion`      | نسخه اپلیکیشن — Platform, VersionCode, DownloadUrl, UpdatePriority         |
| `GlobalAppConfig` | تنظیمات کلید-مقدار — ConfigKey, ConfigValue, ConfigValueType, Category     |
| `AppLink`         | لینک‌های اپلیکیشن — LinkKey, Url, LinkOpenType                             |
| `SystemMessage`   | پیام‌های سیستم — Title, Content, MessageType, Priority, StartDate, EndDate |
| `MaintenanceMode` | حالت تعمیرات — IsEnabled, Title, Message, EstimatedEndDate                 |
| `FeatureFlag`     | Feature Flag — FeatureKey, IsEnabled, Description                          |

---

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint                          | Auth      | توضیح                         |
| ------ | --------------------------------- | --------- | ----------------------------- |
| POST   | `/api/v1/auth/login`              | Anonymous | ورود با نام کاربری و رمز عبور |
| POST   | `/api/v1/auth/refresh`            | Anonymous | تازه‌سازی توکن                |
| POST   | `/api/v1/auth/logout`             | Authorize | خروج                          |
| POST   | `/api/v1/auth/register`           | Anonymous | ثبت‌نام                       |
| POST   | `/api/v1/auth/forgot-password`    | Anonymous | فراموشی رمز عبور              |
| POST   | `/api/v1/auth/reset-password`     | Anonymous | تغییر رمز عبور با OTP         |
| POST   | `/api/v1/auth/change-password`    | Authorize | تغییر رمز عبور                |
| GET    | `/api/v1/auth/me`                 | Authorize | اطلاعات کاربر جاری            |

### Admin Users (`/api/v1/AdminUsers`)

| Method | Endpoint                          | Auth      | توضیح                         |
| ------ | --------------------------------- | --------- | ----------------------------- |
| GET    | `/api/v1/AdminUsers`              | Admin     | لیست تمام کاربران             |
| DELETE | `/api/v1/AdminUsers/{userId}`     | Admin     | حذف کاربر                     |
| PATCH  | `/api/v1/AdminUsers/{userId}/activate` | Admin | فعال‌سازی کاربر          |
| PATCH  | `/api/v1/AdminUsers/{userId}/deactivate` | Admin | غیرفعال‌سازی کاربر      |
| POST   | `/api/v1/AdminUsers/{userId}/roles` | Admin   | افزودن نقش به کاربر           |
| DELETE | `/api/v1/AdminUsers/{userId}/roles/{roleId}` | Admin | حذف نقش از کاربر      |

### Roles (`/api/v1/Roles`)

| Method | Endpoint                          | Auth      | توضیح                         |
| ------ | --------------------------------- | --------- | ----------------------------- |
| GET    | `/api/v1/Roles`                   | Admin     | لیست تمام نقش‌ها              |
| GET    | `/api/v1/Roles/{roleId}`          | Admin     | جزئیات نقش با دسترسی‌ها        |
| POST   | `/api/v1/Roles`                   | Admin     | ایجاد نقش جدید                |
| PUT    | `/api/v1/Roles/{roleId}`          | Admin     | ویرایش نقش                    |
| DELETE | `/api/v1/Roles/{roleId}`          | Admin     | حذف نقش (soft delete)         |
| POST   | `/api/v1/Roles/{roleId}/permissions/{permissionId}` | Admin | افزودن دسترسی به نقش |
| DELETE | `/api/v1/Roles/{roleId}/permissions/{permissionId}` | Admin | حذف دسترسی از نقش   |
| GET    | `/api/v1/Roles/{roleId}/permissions` | Admin  | لیست دسترسی‌های نقش           |

### Permissions (`/api/v1/Permissions`)

| Method | Endpoint                          | Auth      | توضیح                         |
| ------ | --------------------------------- | --------- | ----------------------------- |
| GET    | `/api/v1/Permissions`             | Admin     | لیست تمام دسترسی‌ها           |
| GET    | `/api/v1/Permissions/by-category` | Admin     | دسترسی‌ها بر اساس دسته‌بندی   |
| GET    | `/api/v1/Permissions/{permissionId}` | Admin  | جزئیات دسترسی                 |
| POST   | `/api/v1/Permissions`             | Admin     | ایجاد دسترسی جدید             |
| PUT    | `/api/v1/Permissions/{permissionId}` | Admin  | ویرایش دسترسی                 |
| DELETE | `/api/v1/Permissions/{permissionId}` | Admin  | حذف دسترسی (soft delete)      |

### Auth (`api/sessions`, `api/tokens`)

| Method | Endpoint               | Auth      | توضیح                         |
| ------ | ---------------------- | --------- | ----------------------------- |
| POST   | `/api/sessions`        | Anonymous | ورود با نام کاربری و رمز عبور |
| POST   | `/api/tokens/refresh`  | Anonymous | تازه‌سازی توکن                |
| DELETE | `/api/sessions/current`| Authorize | خروج                          |

### Users (`/api/v1/Users`)

| Method | Endpoint                          | Auth      | توضیح                         |
| ------ | --------------------------------- | --------- | ----------------------------- |
| POST   | `/`                               | Anonymous | ثبت‌نام                       |
| GET    | `/current`                        | Authorize | اطلاعات کاربر جاری            |
| GET    | `/{id}`                           | Admin     | دریافت کاربر با شناسه        |
| PATCH  | `/current`                        | Authorize | ویرایش پروفایل               |
| PATCH  | `/current/password`               | Authorize | تغییر رمز عبور               |
| GET    | `/`                               | Admin     | لیست تمام کاربران            |
| PATCH  | `/{id}`                           | Admin     | ویرایش کاربر                 |
| DELETE | `/{id}`                           | Admin     | حذف کاربر                    |
| PATCH  | `/{id}/activate`                  | Admin     | فعال‌سازی کاربر              |
| PATCH  | `/{id}/deactivate`                | Admin     | غیرفعال‌سازی کاربر           |
| PATCH  | `/{id}/lock`                      | Admin     | قفل کردن کاربر (با مدت زمان) |
| PATCH  | `/{id}/unlock`                    | Admin     | باز کردن قفل کاربر           |
| PATCH  | `/{id}/block`                     | Admin     | بلاک کردن دائمی کاربر        |
| PATCH  | `/{id}/unblock`                   | Admin     | آنبلاک کردن کاربر            |

### OTP (`/api/otp`)

| Method | Endpoint                      | Auth      | توضیح                    |
| ------ | ----------------------------- | --------- | ------------------------ |
| POST   | `/requests`                   | Anonymous | ارسال کد OTP             |
| POST   | `/verifications`              | Anonymous | تایید کد OTP             |
| GET    | `/requests/attempts/{phoneNumber}` | Anonymous | تعداد تلاش‌های باقیمانده |
| POST   | `/requests/resend`            | Anonymous | ارسال مجدد OTP           |

### Cargo (`/api/cargos`)

| Method | Endpoint                          | Auth      | توضیح                    |
| ------ | --------------------------------- | --------- | ------------------------ |
| GET    | `/{id}`                           | Anonymous | دریافت بار               |
| GET    | `/`                               | Admin     | لیست تمام بارها          |
| POST   | `/search`                         | Anonymous | جستجو و صفحه‌بندی        |
| POST   | `/`                               | Authorize | ایجاد بار                |
| PUT    | `/{id}`                           | Authorize | ویرایش بار               |
| DELETE | `/{id}`                           | Authorize | حذف بار (soft delete)    |
| PATCH  | `/{id}`                           | Authorize | تغییر وضعیت بار          |
| GET    | `/cargo-types`                    | Anonymous | انواع بار                |
| GET    | `/{cargoId}/reviews`              | Anonymous | نظرات                    |
| POST   | `/{cargoId}/reviews`              | Authorize | افزودن نظر               |
| PATCH  | `/reviews/{reviewId}`             | Authorize | ویرایش نظر               |
| GET    | `/{cargoId}/interests`            | Authorize | علاقه‌مندی‌ها            |
| POST   | `/{cargoId}/interests`            | Authorize | ثبت علاقه‌مندی           |
| PATCH  | `/interests/{interestId}/status`  | Authorize | تغییر وضعیت علاقه‌مندی   |
| GET    | `/{cargoId}/images`               | Anonymous | تصاویر                   |
| POST   | `/{cargoId}/images`               | Authorize | افزودن تصویر             |
| DELETE | `/images/{imageId}`               | Authorize | حذف تصویر                |
| GET    | `/statistics`                     | Admin     | آمار کلی                 |
| GET    | `/statistics/by-status`           | Admin     | آمار بر اساس وضعیت       |
| GET    | `/my-cargos`                      | Authorize | بارهای کاربر             |
| GET    | `/my-cargos/by-status`            | Authorize | بارهای کاربر بر اساس وضعیت |
| GET    | `/interested-cargos`              | Authorize | بارهای مورد علاقه راننده |

### Vehicle Types (`/api/vehicletypes`)

| Method | Endpoint                          | Auth      | توضیح                   |
| ------ | --------------------------------- | --------- | ----------------------- |
| GET    | `/types`                          | Anonymous | لیست انواع              |
| GET    | `/all-vehicles`                   | Anonymous | تمام وسایل با زیرنوع‌ها |
| GET    | `/types/{id}`                     | Anonymous | جزئیات نوع              |
| POST   | `/types`                          | Admin     | ایجاد نوع               |
| PUT    | `/types`                          | Admin     | ویرایش نوع              |
| DELETE | `/types/{id}`                     | Admin     | حذف نوع                 |
| GET    | `/types/{typeId}/subtypes`        | Anonymous | زیرنوع‌ها               |
| POST   | `/subtypes`                       | Admin     | ایجاد زیرنوع            |
| DELETE | `/subtypes/{id}`                  | Admin     | حذف زیرنوع              |

### Cities (`/api/cities`)

| Method | Endpoint                          | Auth      | توضیح                   |
| ------ | --------------------------------- | --------- | ----------------------- |
| GET    | `/`                               | Anonymous | لیست شهرها              |
| GET    | `/{id}`                           | Anonymous | شهر با شناسه            |
| GET    | `/by-province/{provinceId}`       | Anonymous | شهرهای استان            |
| GET    | `/by-province-name/{provinceName}`| Anonymous | شهرها بر اساس نام استان |
| POST   | `/`                               | Admin     | ایجاد شهر               |
| PUT    | `/`                               | Admin     | ویرایش شهر              |
| DELETE | `/{id}`                           | Admin     | حذف شهر                 |

### Provinces (`/api/provinces`)

| Method | Endpoint                          | Auth      | توضیح                   |
| ------ | --------------------------------- | --------- | ----------------------- |
| GET    | `/`                               | Anonymous | لیست استان‌ها           |
| GET    | `/{id}`                           | Anonymous | استان با شناسه          |
| POST   | `/`                               | Admin     | ایجاد استان             |
| PUT    | `/`                               | Admin     | ویرایش استان            |
| DELETE | `/{id}`                           | Admin     | حذف استان               |
| GET    | `/{id}/cities`                    | Anonymous | شهرهای استان            |

### Configuration

| Controller      | Endpoint               | توضیح                                    |
| --------------- | ---------------------- | ---------------------------------------- |
| GlobalAppConfig | `/api/globalappconfig` | تنظیمات کلی اپلیکیشن (CRUD)              |
| FeatureFlags    | `/api/featureflags`    | Feature Flagها (CRUD + GetEnabled)       |
| Maintenance     | `/api/maintenance`     | حالت تعمیرات (Get/Set/Update)            |
| SystemMessages  | `/api/systemmessages`  | پیام‌های سیستم (CRUD + View/Click count) |
| AppVersions     | `/api/appversions`     | نسخه‌های اپلیکیشن (CRUD + Active/Platform) |
| AppLinks        | `/api/applinks`        | لینک‌های اپلیکیشن (CRUD + Active/Key)   |

---

## امنیت و احراز هویت

### JWT Authentication

- **Token Expiry**: 60 دقیقه
- **Refresh Token Expiry**: 7 روز
- **Issuer**: Loading-API
- **Audience**: Loading-Client
- **Algorithm**: Symmetric Key (HS256)

### Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer
Content-Security-Policy: default-src 'self'
```

### سیستم قفل کار.lockout)

- حداکثر 5 تلاش ناموفق
- قفل به مدت 15 دقیقه
- Auto-lockout بعد از 5 تلاش ناموفق

---

## زیرساخت (Infrastructure)

### Database

- **PostgreSQL** با Npgsql.EntityFrameworkCore.PostgreSQL
- **Retry Policy**: 5 بار با تاخیر 30 ثانیه‌ای
- **Command Timeout**: 60 ثانیه
- **Migrations Assembly**: Loading.Infrastructure.Data

### Caching

- **Redis**: `127.0.0.1:6379` — Distributed Cache
- **Memory Cache**: Fallback در صورت عدم وجود Redis
- **Response Cache**: با تنظیمات `CacheSettings` در appsettings

### Logging

- **Serilog** با خروجی Console + File (روزانه Rolling)
- **Request Logging**: Serilog Request Logging
- **Security Logging**: لاگ خطاها و challenge‌های JWT

### CORS

- **Development**: AllowAll (هر origin)
- **Production**: فقط دامنه‌های مجاز

---

## Seed Data

### نقش‌ها

| نام           | توضیح        |
| ------------- | ------------ |
| Administrator | دسترسی کامل  |
| Driver        | دسترسی محدود |
| LoadOwner     | دسترسی متوسط |

### کاربر پیش‌فرض

- **Username**: admin
- **Password**: Admin123!
- **نقش**: Administrator

### انواع بار

مواد غذایی، مواد ساختمانی، فلزات، مواد شیمیایی، لوازم خانگی، خودرو، محصولات کشاورزی، سایر

### انواع وسیله نقلیه

تریلی، کمپرسی، اتاق دار، یخچالدار، کانتینر دار، مسقف، کمرشکن، وانت بار، تانکر، بونکر

---

## تنظیمات قابل پیکربندی (appsettings.json)

| بخش                                   | توضیح                            |
| ------------------------------------- | -------------------------------- |
| `ConnectionStrings.DefaultConnection` | اتصال PostgreSQL                 |
| `ConnectionStrings.Redis`             | اتصال Redis                      |
| `Jwt.*`                               | تنظیمات JWT                      |
| `SmsSettings`                         | تنظیمات SMS (Kavenegar)          |
| `EmailSettings`                       | تنظیمات ایمیل (SMTP)             |
| `CorsSettings`                        | تنظیمات CORS                     |
| `CacheSettings`                       | تنظیمات کش                       |
| `FileUploadSettings`                  | تنظیمات آپلود فایل (حداکثر 10MB) |
| `PasswordPolicy`                      | سیاست رمز عبور                   |
| `LockoutPolicy`                       | سیاست قفل حساب                   |
| `SessionSettings`                     | تنظیمات Session                  |

---

## نکات فنی

- **Soft Delete**: تمام موجودیت‌ها از الگوی حذف نرم استفاده می‌کنند (IsDeleted + DeletedDate + DeletedBy)
- **Audit Trail**: تمام موجودیت‌ها فیلدهای CreatedDate, ModifiedDate, CreatedBy, ModifiedBy دارند
- **Concurrency**: فیلد ConcurrencyStamp (RowVersion) برای جلوگیری از تداخل همزمان
- **Result Pattern**: سرویس‌ها از الگوی `Result<T>` برای مدیریت خطا استفاده می‌کنند (Success/Failure + Error message)
- **MediatR**: در Application Layer نصب شده اما هنوز استفاده نشده (آماده برای CQRS)
- **Swagger**: در حالت Development فعال با پشتیبانی JWT
- **Health Check**: endpoint `/health` برای مانیتورینگ
- **API Versioning**: نسخه 1.0 به عنوان پیش‌فرض
- **Response Null Handling**: JSON serialization با `JsonIgnoreCondition.WhenWritingNull`
