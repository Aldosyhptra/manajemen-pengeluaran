-- Role untuk database LOKAL (Docker). Password di sini hanya untuk pengembangan.
CREATE ROLE n8n_writer LOGIN PASSWORD 'dev_only_password';
CREATE ROLE n8n_reader LOGIN PASSWORD 'dev_only_password';
CREATE ROLE app_web    LOGIN PASSWORD 'dev_only_password';

GRANT USAGE ON SCHEMA public TO n8n_writer, n8n_reader, app_web;
GRANT SELECT, INSERT ON pengeluaran, kalori TO n8n_writer;
GRANT SELECT         ON pengeluaran, kalori TO n8n_reader;
GRANT SELECT ON pengeluaran, kalori, pengaturan TO app_web;
GRANT INSERT, UPDATE ON pengaturan TO app_web;
ALTER ROLE app_web SET statement_timeout = '5s';
