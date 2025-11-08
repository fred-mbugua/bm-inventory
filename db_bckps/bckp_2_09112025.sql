--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-11-09 00:50:50

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 60118)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5023 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 241 (class 1255 OID 60129)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 223 (class 1259 OID 60208)
-- Name: configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configurations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    key character varying(100) NOT NULL,
    value text NOT NULL,
    description text,
    is_editable_by_admin boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.configurations OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 60239)
-- Name: device_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.device_statuses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_system_status boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.device_statuses OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 60268)
-- Name: devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.devices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    model_id uuid NOT NULL,
    imei character varying(15) NOT NULL,
    cost_price numeric(10,2) NOT NULL,
    selling_price numeric(10,2) NOT NULL,
    status_id uuid NOT NULL,
    added_by_user_id uuid,
    assigned_to_user_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.devices OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 60223)
-- Name: logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logs (
    id bigint NOT NULL,
    action character varying(100) NOT NULL,
    user_id uuid,
    entity_type character varying(50) NOT NULL,
    entity_id uuid,
    payload jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.logs OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 60222)
-- Name: logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logs_id_seq OWNER TO postgres;

--
-- TOC entry 5024 (class 0 OID 0)
-- Dependencies: 224
-- Name: logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.logs_id_seq OWNED BY public.logs.id;


--
-- TOC entry 218 (class 1259 OID 60130)
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 60253)
-- Name: phone_models; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.phone_models (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    default_cost_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    default_selling_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    specifications text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.phone_models OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 60196)
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    token character varying(255) NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 60155)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 60141)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_system_role boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 60320)
-- Name: sale_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sale_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sale_id uuid,
    device_id uuid,
    model_name_at_sale character varying(255) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    cost_price_at_sale numeric(10,2) NOT NULL,
    item_profit numeric(10,2) NOT NULL,
    imei_at_sale character varying(15) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sale_items OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 60302)
-- Name: sales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    receipt_no character varying(50) NOT NULL,
    sale_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    customer_name character varying(150) NOT NULL,
    customer_phone character varying(50),
    total_amount numeric(10,2) NOT NULL,
    total_profit numeric(10,2) NOT NULL,
    sold_by_user_id uuid,
    email_sent boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sales OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 60170)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(150) NOT NULL,
    role_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id uuid
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4766 (class 2604 OID 60226)
-- Name: logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs ALTER COLUMN id SET DEFAULT nextval('public.logs_id_seq'::regclass);


--
-- TOC entry 5010 (class 0 OID 60208)
-- Dependencies: 223
-- Data for Name: configurations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.configurations (id, key, value, description, is_editable_by_admin, created_at, updated_at) FROM stdin;
83d79c58-7739-4113-b527-0300b3bd2a8f	COMPANY_NAME	TechCell POS	The official name of the business.	t	2025-11-08 23:54:33.88857+03	2025-11-08 23:54:33.88857+03
c04c81d2-81f3-4266-89f5-a800c6f7fea1	SALES_EMAIL_RECIPIENT	accounting@techcell.com	Email address for daily/weekly sales reports.	t	2025-11-08 23:54:33.88857+03	2025-11-08 23:54:33.88857+03
d62447fa-3ac5-464e-8a7d-985e537edbbe	INVENTORY_THRESHOLD	10	Minimum stock quantity before generating low inventory alert.	t	2025-11-08 23:54:33.88857+03	2025-11-08 23:54:33.88857+03
3efcbb8d-6adc-4b8f-8cb4-bfbf9b0d4108	API_VERSION	1.0.0	Current API version (System use).	f	2025-11-08 23:54:33.88857+03	2025-11-08 23:54:33.88857+03
\.


--
-- TOC entry 5013 (class 0 OID 60239)
-- Dependencies: 226
-- Data for Name: device_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.device_statuses (id, name, description, is_system_status, created_at, updated_at) FROM stdin;
00000000-0000-0000-0000-000000000001	In-Stock	The device is available for sale.	t	2025-11-08 23:54:33.88857+03	2025-11-08 23:54:33.88857+03
00000000-0000-0000-0000-000000000002	Sold	The device has been sold and accounted for.	t	2025-11-08 23:54:33.88857+03	2025-11-08 23:54:33.88857+03
00000000-0000-0000-0000-000000000003	Damaged	The device is unusable and written off.	t	2025-11-08 23:54:33.88857+03	2025-11-08 23:54:33.88857+03
\.


--
-- TOC entry 5015 (class 0 OID 60268)
-- Dependencies: 228
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.devices (id, model_id, imei, cost_price, selling_price, status_id, added_by_user_id, assigned_to_user_id, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5012 (class 0 OID 60223)
-- Dependencies: 225
-- Data for Name: logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logs (id, action, user_id, entity_type, entity_id, payload, created_at) FROM stdin;
\.


--
-- TOC entry 5005 (class 0 OID 60130)
-- Dependencies: 218
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, name, description, created_at) FROM stdin;
2e631697-bc3f-40df-b995-c1bc24668d31	user:manage	Create, update, and deactivate user accounts.	2025-11-08 23:54:33.88857+03
9eaee2a1-1530-41a9-933d-24383a5aa45f	role:manage	Create, update, and delete custom roles and assign permissions.	2025-11-08 23:54:33.88857+03
37c679e8-01b4-4a01-8f70-bddb6378de4c	role:view_permissions	View the list of all available permissions.	2025-11-08 23:54:33.88857+03
633acb27-905a-4953-a692-40015417decf	config:manage	Manage application configurations (e.g., company details).	2025-11-08 23:54:33.88857+03
e0844c74-48d9-4cd9-8ab8-39ad0d202fda	inventory:manage	Add/remove stock, update model information (Admin-level inventory).	2025-11-08 23:54:33.88857+03
811cbd23-86ca-4973-a087-3246f49f6812	device:view	View current stock levels and device details (Sales/Manager level).	2025-11-08 23:54:33.88857+03
c7651258-b511-4c8d-9d34-9006762ef0a2	device:assign	Ability to assign devices to specific sales users for accountability.	2025-11-08 23:54:33.88857+03
188ad54d-54b3-4f9d-8570-2849b3c2bb72	sale:create	Process and complete new sales transactions.	2025-11-08 23:54:33.88857+03
3c053025-6e0d-476c-b5f2-d08a1d6eff3d	sale:view_all	View all sales records (Manager-level sales audit).	2025-11-08 23:54:33.88857+03
da087638-7081-4b1d-aade-f274f214bfcc	report:view_stock	View current inventory reports.	2025-11-08 23:54:33.88857+03
e553c56f-d678-45aa-951d-e0655b5be00a	report:view_financial	View sensitive financial reports (Profit/Loss).	2025-11-08 23:54:33.88857+03
\.


--
-- TOC entry 5014 (class 0 OID 60253)
-- Dependencies: 227
-- Data for Name: phone_models; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.phone_models (id, name, default_cost_price, default_selling_price, specifications, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5009 (class 0 OID 60196)
-- Dependencies: 222
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (token, user_id, expires_at, created_at) FROM stdin;
\.


--
-- TOC entry 5007 (class 0 OID 60155)
-- Dependencies: 220
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
\.


--
-- TOC entry 5006 (class 0 OID 60141)
-- Dependencies: 219
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, is_system_role, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5017 (class 0 OID 60320)
-- Dependencies: 230
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sale_items (id, sale_id, device_id, model_name_at_sale, quantity, unit_price, cost_price_at_sale, item_profit, imei_at_sale, created_at) FROM stdin;
\.


--
-- TOC entry 5016 (class 0 OID 60302)
-- Dependencies: 229
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales (id, receipt_no, sale_date, customer_name, customer_phone, total_amount, total_profit, sold_by_user_id, email_sent, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5008 (class 0 OID 60170)
-- Dependencies: 221
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, full_name, role_id, is_active, created_at, updated_at, created_by_user_id) FROM stdin;
\.


--
-- TOC entry 5025 (class 0 OID 0)
-- Dependencies: 224
-- Name: logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.logs_id_seq', 1, false);


--
-- TOC entry 4808 (class 2606 OID 60220)
-- Name: configurations configurations_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configurations
    ADD CONSTRAINT configurations_key_key UNIQUE (key);


--
-- TOC entry 4810 (class 2606 OID 60218)
-- Name: configurations configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configurations
    ADD CONSTRAINT configurations_pkey PRIMARY KEY (id);


--
-- TOC entry 4816 (class 2606 OID 60251)
-- Name: device_statuses device_statuses_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_statuses
    ADD CONSTRAINT device_statuses_name_key UNIQUE (name);


--
-- TOC entry 4818 (class 2606 OID 60249)
-- Name: device_statuses device_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_statuses
    ADD CONSTRAINT device_statuses_pkey PRIMARY KEY (id);


--
-- TOC entry 4824 (class 2606 OID 60277)
-- Name: devices devices_imei_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_imei_key UNIQUE (imei);


--
-- TOC entry 4826 (class 2606 OID 60275)
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- TOC entry 4814 (class 2606 OID 60231)
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4789 (class 2606 OID 60140)
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- TOC entry 4791 (class 2606 OID 60138)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4820 (class 2606 OID 60266)
-- Name: phone_models phone_models_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phone_models
    ADD CONSTRAINT phone_models_name_key UNIQUE (name);


--
-- TOC entry 4822 (class 2606 OID 60264)
-- Name: phone_models phone_models_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.phone_models
    ADD CONSTRAINT phone_models_pkey PRIMARY KEY (id);


--
-- TOC entry 4806 (class 2606 OID 60201)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (token);


--
-- TOC entry 4797 (class 2606 OID 60159)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- TOC entry 4793 (class 2606 OID 60153)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 4795 (class 2606 OID 60151)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4837 (class 2606 OID 60327)
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4839 (class 2606 OID 60329)
-- Name: sale_items sale_items_sale_id_device_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_device_id_key UNIQUE (sale_id, device_id);


--
-- TOC entry 4831 (class 2606 OID 60311)
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- TOC entry 4833 (class 2606 OID 60313)
-- Name: sales sales_receipt_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_receipt_no_key UNIQUE (receipt_no);


--
-- TOC entry 4799 (class 2606 OID 60184)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4801 (class 2606 OID 60180)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4803 (class 2606 OID 60182)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4827 (class 1259 OID 60301)
-- Name: idx_devices_assigned_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_devices_assigned_user ON public.devices USING btree (assigned_to_user_id);


--
-- TOC entry 4828 (class 1259 OID 60299)
-- Name: idx_devices_imei; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_devices_imei ON public.devices USING btree (imei);


--
-- TOC entry 4829 (class 1259 OID 60300)
-- Name: idx_devices_model_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_devices_model_status ON public.devices USING btree (model_id, status_id);


--
-- TOC entry 4811 (class 1259 OID 60238)
-- Name: idx_logs_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_entity ON public.logs USING btree (entity_type, entity_id);


--
-- TOC entry 4812 (class 1259 OID 60237)
-- Name: idx_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_logs_user_id ON public.logs USING btree (user_id);


--
-- TOC entry 4804 (class 1259 OID 60207)
-- Name: idx_refresh_token_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_token_user_id ON public.refresh_tokens USING btree (user_id);


--
-- TOC entry 4834 (class 1259 OID 60341)
-- Name: idx_sale_items_device_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sale_items_device_id ON public.sale_items USING btree (device_id);


--
-- TOC entry 4835 (class 1259 OID 60340)
-- Name: idx_sale_items_sale_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sale_items_sale_id ON public.sale_items USING btree (sale_id);


--
-- TOC entry 4855 (class 2620 OID 60221)
-- Name: configurations update_configurations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_configurations_updated_at BEFORE UPDATE ON public.configurations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4856 (class 2620 OID 60252)
-- Name: device_statuses update_device_statuses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_device_statuses_updated_at BEFORE UPDATE ON public.device_statuses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4858 (class 2620 OID 60298)
-- Name: devices update_devices_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4857 (class 2620 OID 60267)
-- Name: phone_models update_phone_models_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_phone_models_updated_at BEFORE UPDATE ON public.phone_models FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4853 (class 2620 OID 60154)
-- Name: roles update_roles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4859 (class 2620 OID 60319)
-- Name: sales update_sales_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4854 (class 2620 OID 60195)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4846 (class 2606 OID 60288)
-- Name: devices devices_added_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_added_by_user_id_fkey FOREIGN KEY (added_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4847 (class 2606 OID 60293)
-- Name: devices devices_assigned_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4848 (class 2606 OID 60278)
-- Name: devices devices_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.phone_models(id) ON DELETE RESTRICT;


--
-- TOC entry 4849 (class 2606 OID 60283)
-- Name: devices devices_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.device_statuses(id) ON DELETE RESTRICT;


--
-- TOC entry 4845 (class 2606 OID 60232)
-- Name: logs logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4844 (class 2606 OID 60202)
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4840 (class 2606 OID 60165)
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 4841 (class 2606 OID 60160)
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- TOC entry 4851 (class 2606 OID 60335)
-- Name: sale_items sale_items_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id) ON DELETE RESTRICT;


--
-- TOC entry 4852 (class 2606 OID 60330)
-- Name: sale_items sale_items_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- TOC entry 4850 (class 2606 OID 60314)
-- Name: sales sales_sold_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_sold_by_user_id_fkey FOREIGN KEY (sold_by_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 4842 (class 2606 OID 60190)
-- Name: users users_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- TOC entry 4843 (class 2606 OID 60185)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


-- Completed on 2025-11-09 00:50:53

--
-- PostgreSQL database dump complete
--

