--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2 (Debian 16.2-1.pgdg120+2)
-- Dumped by pg_dump version 16.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: channel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.channel (
    id uuid NOT NULL,
    name text NOT NULL,
    is_public boolean NOT NULL,
    workspace_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by uuid NOT NULL
);


ALTER TABLE public.channel OWNER TO postgres;

--
-- Name: channel_member; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.channel_member (
    id uuid NOT NULL,
    channel_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.channel_member OWNER TO postgres;

--
-- Name: channel_thread; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.channel_thread (
    id uuid NOT NULL,
    channel_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.channel_thread OWNER TO postgres;

--
-- Name: channel_thread_message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.channel_thread_message (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    channel_thread_id uuid NOT NULL,
    message text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.channel_thread_message OWNER TO postgres;

--
-- Name: user_message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_message (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    message text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    workspace_id uuid NOT NULL
);


ALTER TABLE public.user_message OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    display_name text,
    bio text,
    phone_number text,
    timezone text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_seen timestamp(6) with time zone,
    password text NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: workspace; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workspace (
    id uuid NOT NULL,
    name text NOT NULL,
    owner_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    url_slug text NOT NULL
);


ALTER TABLE public.workspace OWNER TO postgres;

--
-- Name: workspace_member; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workspace_member (
    user_id uuid NOT NULL,
    workspace_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type text DEFAULT 'member'::text NOT NULL
);


ALTER TABLE public.workspace_member OWNER TO postgres;

--
-- Name: workspace_user_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.workspace_user_type (
    type text NOT NULL
);


ALTER TABLE public.workspace_user_type OWNER TO postgres;

--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: channel_member channel_member_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.channel_member
    ADD CONSTRAINT channel_member_pkey PRIMARY KEY (id);


--
-- Name: channel_thread_message channel_thread_message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.channel_thread_message
    ADD CONSTRAINT channel_thread_message_pkey PRIMARY KEY (id);


--
-- Name: channel_thread channel_thread_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.channel_thread
    ADD CONSTRAINT channel_thread_pkey PRIMARY KEY (id);


--
-- Name: channel channels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.channel
    ADD CONSTRAINT channels_pkey PRIMARY KEY (id);


--
-- Name: user_message user_message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_message
    ADD CONSTRAINT user_message_pkey PRIMARY KEY (id);


--
-- Name: workspace_user_type user_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_user_type
    ADD CONSTRAINT user_type_pkey PRIMARY KEY (type);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: workspace_member workspace_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_member
    ADD CONSTRAINT workspace_members_pkey PRIMARY KEY (user_id, workspace_id);


--
-- Name: workspace workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace
    ADD CONSTRAINT workspace_pkey PRIMARY KEY (id);


--
-- Name: workspace_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX workspace_name_key ON public.workspace USING btree (name);


--
-- Name: workspace_url_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX workspace_url_slug_key ON public.workspace USING btree (url_slug);


--
-- Name: channel_member channel_member_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.channel_member
    ADD CONSTRAINT channel_member_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channel(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: channel_member channel_member_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.channel_member
    ADD CONSTRAINT channel_member_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: channel_thread channel_thread_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.channel_thread
    ADD CONSTRAINT channel_thread_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channel(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: channel_thread_message channel_thread_message_channel_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.channel_thread_message
    ADD CONSTRAINT channel_thread_message_channel_thread_id_fkey FOREIGN KEY (channel_thread_id) REFERENCES public.channel_thread(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: channel_thread_message channel_thread_message_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.channel_thread_message
    ADD CONSTRAINT channel_thread_message_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: channel channels_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.channel
    ADD CONSTRAINT channels_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspace(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: user_message user_message_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_message
    ADD CONSTRAINT user_message_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: user_message user_message_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_message
    ADD CONSTRAINT user_message_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: user_message user_message_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_message
    ADD CONSTRAINT user_message_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspace(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: workspace_member workspace_member_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_member
    ADD CONSTRAINT workspace_member_type_fkey FOREIGN KEY (type) REFERENCES public.workspace_user_type(type) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: workspace_member workspace_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_member
    ADD CONSTRAINT workspace_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: workspace_member workspace_members_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace_member
    ADD CONSTRAINT workspace_members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspace(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: workspace workspace_owner_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.workspace
    ADD CONSTRAINT workspace_owner_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

