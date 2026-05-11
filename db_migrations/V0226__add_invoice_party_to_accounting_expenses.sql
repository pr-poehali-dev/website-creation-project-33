ALTER TABLE t_p24058207_website_creation_pro.accounting_expenses
ADD COLUMN invoice_party character varying(10) NULL DEFAULT NULL
CHECK (invoice_party IN ('kms', 'kvv'));